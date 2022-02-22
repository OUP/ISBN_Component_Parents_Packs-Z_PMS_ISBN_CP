sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/ui/table/RowAction",
    "sap/ui/table/RowActionItem",
    "sap/ui/core/Fragment",
    "sap/m/MessageToast",
  ],
  function (_Controller, RowAction, RowActionItem, Fragment, MessageToast) {
    "use strict";

    let _sIdPrefix;
    let _oTable;
    let _oPreqTextDialog;
    let _oView;

    const oController = {
      onInit: function () {
        _sIdPrefix =
          "oup.pms.zpmsisbncp::sap.suite.ui.generic.template.ListReport.view.ListReport::ZPMS_C_ISBN_COMP_PACK--";

        // get view
        _oView = this.getView();

        // grid table
        _oTable = this.byId(_sIdPrefix + "GridTable");

        // set table row deletable
        this._initTableNavigation();
      },

      onAfterRendering: function () {
        _oTable.attachBusyStateChanged(this._onBusyStateChanged);
      },

      onWbsActivityPress: function (oEvent) {
        try {
          const oRow = oEvent.getParameter("row");
          const oContext = oRow.getBindingContext();
          const oData = oContext.getObject() || null;

          // target
          const oTarget = {
            semanticObject: "ZWBSActivity",
            action: "manage",
          };

          // params
          const posid = oData.wbs || "";
          const oParams = {
            posid,
          };

          // navigation
          this._navToTarget(oTarget, oParams);
        } catch (error) {}
      },

      onPRNavPress: function (oEvent) {
        const oRowObject = oEvent.getSource().getBindingContext().getObject();
        const PurchaseRequisition = oRowObject.banfn;

        // target
        const oTarget = {
          semanticObject: "PurchaseRequisition",
          action: "manage",
        };

        // params
        const oParams = {
          PurchaseRequisition,
        };

        this._navToTarget(oTarget, oParams);
      },

      onPreqTextPress: async function () {
        try {
          const oPlugins = _oTable.getPlugins()[0];
          const iSelectedIndex = oPlugins.getSelectedIndex();
          const oContext = _oTable.getContextByIndex(iSelectedIndex);
          const oData = oContext.getObject() || null;

          if (!_oPreqTextDialog) {
            // initialize dialog
            _oPreqTextDialog = await this._loadFragment(
              `oup.pms.zpmsisbncp.ext.view.fragment.PreqText`,
              this
            );

            // add view dependent
            _oView.addDependent(_oPreqTextDialog);
          }

          const dataRequested = () => _oPreqTextDialog.setBusy(true);
          const dataReceived = () => _oPreqTextDialog.setBusy(false);

          // preq text model
          _oPreqTextDialog.setModel(_oView.getModel("isbnModel"));

          // bind element for the dialog
          _oPreqTextDialog.bindElement({
            path: `isbnModel>/ZPMSPREQTEXTSet(Posid='${oData.wbs}',Banfn='${oData.banfn}')`,
            events: {
              dataRequested,
              dataReceived,
            },
          });

          // open dialog
          _oPreqTextDialog.open();
        } catch (error) {}
      },

      onPreqTextDialogCancel: () => _oPreqTextDialog.close(),

      onPreqTextDialogSave: () => {
        const fnSuccess = (_) => {
          MessageToast.show("Saved Successfully !");
          _oPreqTextDialog.close();
        };

        const fnError = (_) => {
          MessageToast.show(`Error - ${_}`);
        };

        _oView.getModel("isbnModel").submitChanges({
          success: fnSuccess,
          error: fnError,
        });
      },

      /* =========================================================== */
      /* internal methods                                            */
      /* =========================================================== */

      _loadFragment: (sPath, _oThis) =>
        new Promise((reslove, reject) =>
          Fragment.load({
            name: sPath,
            controller: _oThis,
          })
            .then((oFragment) => reslove(oFragment))
            .catch((oError) => reject(oError))
        ),

      _initTableNavigation: function () {
        var oTemplate = _oTable.getRowActionTemplate();
        if (oTemplate) {
          oTemplate.destroy();
          oTemplate = null;
        }

        oTemplate = new RowAction({
          items: [
            new RowActionItem({
              type: "Navigation",
              text: "Activities",
              press: this.onWbsActivityPress.bind(this),
            }),
          ],
        });

        _oTable.setRowActionTemplate(oTemplate);
        _oTable.setRowActionCount(1);
      },

      _onBusyStateChanged: function (oEvent) {
        const bBusy = oEvent.getParameter("busy");

        if (!bBusy) {
          let oTpc = null;

          // grid table
          if (sap.ui.table.TablePointerExtension) {
            oTpc = new sap.ui.table.TablePointerExtension(_oTable);
          } else {
            oTpc = new sap.ui.table.extensions.Pointer(_oTable);
          }

          // columns
          const aColumns = _oTable.getColumns();
          for (let i = aColumns.length; i >= 0; i--) {
            oTpc.doAutoResizeColumn(i);
          }
        }
      },

      _navToTarget: (oTarget, oParams) => {
        // navigation
        const xnavservice =
          sap.ushell &&
          sap.ushell.Container &&
          sap.ushell.Container.getService &&
          sap.ushell.Container.getService("CrossApplicationNavigation");

        const _href =
          (xnavservice &&
            xnavservice.toExternal({
              target: {
                semanticObject: oTarget.semanticObject,
                action: oTarget.action,
              },
              params: oParams,
            })) ||
          "";
      },
    };

    return oController;
  }
);
