sap.ui.define([
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/core/Fragment"
], function(MessageToast,MessageBox,Fragment) {
    'use strict';

    function _createUploadController(oExtensionAPI) {
        var oUploadDialog;

        function setOkButtonEnabled(bOk) {
            oUploadDialog && oUploadDialog.getBeginButton().setEnabled(bOk);
        }

        function setDialogBusy(bBusy) {
            oUploadDialog.setBusy(bBusy)
        }

        function closeDialog() {
            oUploadDialog && oUploadDialog.close()
        }

        function showError(sMessage) {
            MessageBox.error(sMessage )
        }

        // TODO: Better option for this?
        function byId(sId) {
            return sap.ui.core.Fragment.byId("uploadDialogId", sId);
        }

        return {
            onBeforeOpen: function (oEvent) {
                oUploadDialog = oEvent.getSource();
                oExtensionAPI.addDependent(oUploadDialog);
            },

            onAfterClose: function (oEvent) {
                oExtensionAPI.removeDependent(oUploadDialog);
                oUploadDialog.destroy();
                oUploadDialog = undefined;
            },

            onOk: function (oEvent) {
                setDialogBusy(true)
                //fragment.xml中uploader控件的ID
                var oFileUploader = byId("uploader")

                var headPar = new sap.ui.unified.FileUploaderParameter();
                    //设置参数
                    headPar.setName('slug');
                    headPar.setValue('CDSViews');
                    oFileUploader.removeHeaderParameter('slug');
                    oFileUploader.addHeaderParameter(headPar);
                    //设置excelupload服务路径，需要加上/excel（其中excel是entity中声明的属性）
                    var sUploadUri = oExtensionAPI._controller.extensionAPI._controller._oAppComponent.getManifestObject().resolveUri("/embedding/excelupload/excel")
                    oFileUploader.setUploadUrl(sUploadUri);

                oFileUploader
                    .checkFileReadable()
                    .then(function () {
                        //执行upload动作，调用后端
                        oFileUploader.upload();
                    })
                    .catch(function (error) {
                        showError("The file cannot be read.");
                        setDialogBusy(false)
                    })
            },

            onCancel: function (oEvent) {
                closeDialog();
            },

            onTypeMismatch: function (oEvent) {
                var sSupportedFileTypes = oEvent
                    .getSource()
                    .getFileType()
                    .map(function (sFileType) {
                        return "*." + sFileType;
                    })
                    .join(", ");

                showError(
                    "The file type *." +
                    oEvent.getParameter("fileType") +
                    " is not supported. Choose one of the following types: " +
                    sSupportedFileTypes
                );
            },

            onFileAllowed: function (oEvent) {
                setOkButtonEnabled(true)
            },

            onFileEmpty: function (oEvent) {
                setOkButtonEnabled(false)
            },

        

            onUploadComplete: function (oEvent) {
                //获取返回状态
                var iStatus = oEvent.getParameter("status");
                var oFileUploader = oEvent.getSource()

                oFileUploader.clear();
                setOkButtonEnabled(false)
                setDialogBusy(false)

                if (iStatus >= 400) {
                    var oRawResponse = JSON.parse(oEvent.getParameter("responseRaw"));
                    showError(oRawResponse.error.message);
                } else {
                    MessageToast.show("Uploaded successfully");
                    oExtensionAPI.refresh()
                    closeDialog();
                }
            }
        };
    }

    return {
        onUpload: function(oEvent) {
            //MessageToast.show("Custom handler invoked.");
            Fragment.load({
                id: "uploadDialogId",
                name: "cdsviews-ifgen.ext.fragment.upload",
                controller: _createUploadController(this)
            }).then(function (oDialog) {
                oDialog.open();
            });
        }
    };
});
