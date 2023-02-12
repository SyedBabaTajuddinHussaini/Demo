sap.ui.define([
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/model/Sorter",
	"sap/m/MessageBox",
	"itelligence/deductionManagement/util/Formatter",
	"sap/m/MessageToast"
], function (JSONModel, Controller, Filter, FilterOperator, Sorter, MessageBox, Formatter, MessageToast) {
	"use strict";

	return Controller.extend("itelligence.deductionManagement.controller.SettlementCreation", {
		Formatter: Formatter,
		onInit: function () {

			this.getView().setModel(this.getOwnerComponent().getModel("Flags"), "Flags");
			this.getView().setModel(this.getOwnerComponent().getModel("subtotals"), "Subtotals");
			this.getView().setModel(this.getOwnerComponent().getModel("DeductionsModel"), "DeductionsModel");
			this.getView().setModel(this.getOwnerComponent().getModel("type"), "type");

			this.oRouter = this.getOwnerComponent().getRouter();
			this.oRouter.attachRoutePatternMatched(this._handleRouteMatched, this);
			var FilesModel = new sap.ui.model.json.JSONModel({});

			this.getView().setModel(FilesModel, "files");
			var flagModel = new sap.ui.model.json.JSONModel({
				"Comments": ""
			});

			this.getView().setModel(flagModel, "flagModel");

			var FlagsModel = this.getView().getModel("Flags");
			if (!FlagsModel) {
				var jsModel = new sap.ui.model.json.JSONModel({
					"MoreDeductions": "",
					"NoDeductions": "",
					"Label": "",
					"AmountValidation": "X",
					"Park": ""
				});

				this.getView().setModel(jsModel, "Flags");
			}
		},

		_handleRouteMatched: function (oEvent) {

			if (oEvent.getParameter("name") == "SettlementCreation") {
				this.getView().setModel(this.getOwnerComponent().getModel("SettlementModel"), "SettlementModel");
				this.getView().setModel(this.getOwnerComponent().getModel("subtotals"), "Subtotals");
				this.getView().setModel(this.getOwnerComponent().getModel("DeductionsModel"), "DeductionsModel");
				var DeductionsModel = this.getView().getModel("DeductionsModel");
				var data = $.extend(true, [], DeductionsModel.getData());
				var customer = oEvent.getParameter("arguments").customer;
				this.ClaimType = oEvent.getParameter("arguments").ClaimType;
				var JsModel = new sap.ui.model.json.JSONModel({});

				this.getView().byId("messages").setVisible(false);
				var flagsModel = this.getView().getModel("Flags");
				flagsModel.setProperty("/AmountValidation", "X");

				var model = this.getView().getModel("messages");
				if (model) {
					model.setProperty("/", []);
				}
				var claimNum;
				var title = this.getView().byId("SettlementHeader");
				if (data && data[0] && customer.indexOf("PARK") < 0) {
					claimNum = data[0].ClearDocNum;
					// this.FromParked = "";
					this.fromParked = "";
					this.getView().byId("ClNum").setSelectedKey(claimNum);
					this.getClaim(claimNum);
					// this.getView().byId("Park").setVisible(true);
					JsModel.setData(data);
					this.getView().setModel(JsModel, "ClaimDocumentNumbers");
					this.ParkedData = "";
					flagsModel.setProperty("/Park", "");
					// var msg = Formatter.i18nBundle("SETTLEMENTDETAILS", this);
					// title.setText(msg);
				} else if (customer.indexOf("PARK") !== -1) {
					// this.FromParked = "X";
					this.fromParked = "X";

					claimNum = customer.split("~")[1];
					this.getView().byId("ClNum").setSelectedKey(claimNum);
					// this.getView().byId("ClNum").setSelectedValue(claimNum);
					var ClaimNubmerdata = [];
					ClaimNubmerdata.push({
						"ClearDocNum": claimNum
					});
					JsModel.setData(ClaimNubmerdata);
					this.getView().setModel(JsModel, "ClaimDocumentNumbers");
					this.getClaim(claimNum);
					this.getView().byId("Park").setVisible(false);
					this.ParkedData = "X";
					flagsModel.setProperty("/Park", "X");

				}
			}
		},
		onClaimChange: function (oEvent) {
			var claimNum = oEvent.getSource().getSelectedKey();
			if (claimNum) {
				this.getClaim(claimNum);
			}
		},
		getClaim: function (claimNum) {
			var model = this.getView().getModel();
			var typeModel = this.getOwnerComponent().getModel("type");
			var deductionModel = this.getOwnerComponent().getModel("DeductionModel	");
			var JsModel = new sap.ui.model.json.JSONModel({});
			var title = this.getView().byId("SettlementHeader");
			var oSuccess = function (response) {
				sap.ui.core.BusyIndicator.hide();
				var msg;

				if (this.ParkedData === "X") {
					if (response.results[0].ClearDocTyp == "D") {
						msg = Formatter.i18nBundle("DPARKEDDOCUMENTS", this);
					} else {
						msg = Formatter.i18nBundle("CPARKEDDOCUMENTS", this);
					}
					title.setText(msg);
				} else {
					if (response.results[0].ClearDocTyp == "D") {
						msg = Formatter.i18nBundle("DSETTLEMENTDETAILS", this);
					} else {
						msg = Formatter.i18nBundle("CSETTLEMENTDETAILS", this);
					}
					title.setText(msg);
				}

				//new fields logic
				if (response.results[0].ClearDocTyp == "D") {
					this.getView().byId("ReasoncodeLabelId").setVisible(true);
					this.getView().byId("ReasoncodeTextId").setVisible(true);
					this.getView().byId("ReasoncodeLabelIdDesc").setVisible(true);
					this.getView().byId("ReasoncodeTextIdDesc").setVisible(true);
				}
				else {
					this.getView().byId("ClaimReasonLabelId").setVisible(true);
					this.getView().byId("ClaimReasonTextId").setVisible(true);
					this.getView().byId("ClaimReasonDescLabelId").setVisible(true);
					this.getView().byId("ClaimReasonDescTextId").setVisible(true);
				}

				JsModel.setData(response.results[0]);
				if (!typeModel) {
					typeModel = new sap.ui.model.json.JSONModel({});
					this.getView().setModel(typeModel, "type");
				}
				typeModel.setProperty("/ClDocType", response.results[0].ClearDocTyp);

				this.getView().setModel(this.getOwnerComponent().getModel("DeductionsModel"), "DeductionsModel");
				this.getView().setModel(JsModel, "Claim");
			}.bind(this);
			var oError = function (oError) {
				sap.ui.core.BusyIndicator.hide();
				if (oError.name) {
					sap.m.MessageBox.show(oError.name, sap.m.MessageBox.Icon.ERROR);
				} else {
					var oXmlData = oError.responseText;
					var oXMLModel = new sap.ui.model.xml.XMLModel();
					oXMLModel.setXML(oXmlData);
					var otext = oXMLModel.getProperty("/message");
					sap.m.MessageBox.show(otext, sap.m.MessageBox.Icon.ERROR);
				}
			}.bind(this);
			sap.ui.core.BusyIndicator.show();
			var aFilters = [];

			//aFilters.push(new sap.ui.model.Filter("ContractType", "EQ", this.ClaimType));
			aFilters.push(new sap.ui.model.Filter("ClearDocNum", "EQ", claimNum.replace(/\s+/g, "")));
			model.read("/ProcesClaimDeductionSet", {
				method: "GET",
				success: oSuccess,
				filters: aFilters,
				error: oError
			});

		},
		onBack: function () {
			this.onPressClose();
			var oFCL = this.oView.getParent().getParent();
			if (this.fromParked == "X") {

				oFCL.setLayout(sap.f.LayoutType.OneColumn);
			} else {

				oFCL.setLayout(sap.f.LayoutType.MidColumnFullScreen);
			}
			window.history.go(-1);

		},
		onBackwithoutDel: function () {
			this.onPressCloseWithoutDel();
			var oFCL = this.oView.getParent().getParent();
			if (this.fromParked == "X") {

				oFCL.setLayout(sap.f.LayoutType.OneColumn);
			} else {

				oFCL.setLayout(sap.f.LayoutType.MidColumnFullScreen);
			}
			window.history.go(-1);

		},
		onAttachmentsClick: function (oEvent) {
			this._oAttSrc = oEvent.getSource();
			if (!this._oAttachmentsDialog) {
				this._oAttachmentsDialog = sap.ui.xmlfragment("itelligence.deductionManagement.fragment.AttachmentsPopup", this);
			}
			this.getView().addDependent(this._oAttachmentsDialog);
			this._oAttachmentsDialog.open();

		},
		beforeAttachmentsOpen: function (oEvent) {
			this.getFiles();
		},
		onFileDeleted: function (oEvent) {
			var aFilters = [];
			var that = this;
			var filesModel = this.getView().getModel("files");
			var selectedGuid = oEvent.getParameter("item").getProperty("documentId");
			//ZBIL Changes		
			var typeModel = this.getOwnerComponent().getModel("typeModel");
			var type = typeModel.getProperty("/type");
			if (type == "ZBIL") {
				var ctx = this._oAttSrc.getParent().getBindingContext("SettlementModelZbil").getObject();
				var knumh = ctx.Vbeln;
			} else {
				var ctx = this._oAttSrc.getParent().getBindingContext("SettlementModel").getObject();
				var knumh = ctx.CondRecNum;

			}

			if (this.getView().getModel("Flags").getData().Park === "X") {
				knumh = ctx.CondRecNum;
				var Seqno = ctx.Seqno;
			}
			else {
				var Seqno = ctx.seqno;
				// var knumh = ctx.Vbeln;
			}
			if (knumh === undefined) {
				knumh = "";
			}

			var ContNum = ctx.ContNum;
			var ContractType = ctx.ContractType;
			sap.ui.core.BusyIndicator.show();

			var url = "/DWB_delete_attachmentSet(ContNum='" + ContNum + "',ContractType='" + ContractType + "',Knumh='" + knumh + "',Seqno='" + Seqno + "',Guid=guid'" + selectedGuid + "')";
			var oModel = this.getView().getModel();
			oModel.remove(url, {
				method: "GET",
				success: function (response) {
					sap.ui.core.BusyIndicator.hide();
					that.getFiles();
				},
				error: function (oError) {
					sap.ui.core.BusyIndicator.hide();
					var oXmlData = oError.response.body;
					var oXMLModel = new sap.ui.model.xml.XMLModel();
					oXMLModel.setXML(oXmlData);
					var otext = oXMLModel.getProperty("/message");
					sap.m.MessageBox.show(otext, sap.m.MessageBox.Icon.ERROR);
				}
			});

		},
		/* handle file upload failed event */
		onFileUploadFailed: function (e) {
			sap.ca.ui.message.showMessageBox({
				type: sap.ca.ui.message.Type.ERROR,
				message: e.getParameters().exception.message
			});
		},

		closeDialog: function (oEvent) {

			this._oAttachmentsDialog.close();
			var filesModel = this.getView().getModel("files");
			filesModel.setData([]);
		},
		onUploadFile: function (oEventData) {
			this.UploadCollection = oEventData.getSource();
			var contrl = this.UploadCollection;
			var oView = this.getView();
			this.getFiles();

		},

		/*get the files */
		getFiles: function (oEvent) {
			var aFilters = [];
			var filesModel = this.getView().getModel("files");
			//ZBIL Changes		
			var typeModel = this.getOwnerComponent().getModel("typeModel");
			var type = typeModel.getProperty("/type");
			if (type == "ZBIL") {
				var ctx = this._oAttSrc.getParent().getBindingContext("SettlementModelZbil").getObject();
				aFilters.push(new sap.ui.model.Filter("Knumh", "EQ", ctx.Vbeln));
			} else {
				var ctx = this._oAttSrc.getParent().getBindingContext("SettlementModel").getObject();
				aFilters.push(new sap.ui.model.Filter("Knumh", "EQ", ctx.CondRecNum));
			}
			if (this.getView().getModel("Flags").getData().Park === "X") {
				aFilters.push(new sap.ui.model.Filter("Seqno", "EQ", ctx.Seqno));
			}
			else {
				aFilters.push(new sap.ui.model.Filter("Seqno", "EQ", ctx.seqno));
			}
			aFilters.push(new sap.ui.model.Filter("ContNum", "EQ", ctx.ContNum));
			aFilters.push(new sap.ui.model.Filter("ContractType", "EQ", ctx.ContractType));
			var url = "/DWB_read_attachmentsSet";
			var oModel = this.getView().getModel();
			sap.ui.core.BusyIndicator.show();
			var oSuccess = function (response) {
				sap.ui.core.BusyIndicator.hide();
				filesModel.setData(response.results);
			}.bind(this);
			oModel.read(url, {
				method: "GET",
				filters: aFilters,
				success: oSuccess,
				error: function (oError) {
					sap.ui.core.BusyIndicator.hide();
					var oXmlData = oError.response.body;
					var oXMLModel = new sap.ui.model.xml.XMLModel();
					oXMLModel.setXML(oXmlData);
					var otext = oXMLModel.getProperty("/message");
					sap.m.MessageBox.show(otext, sap.m.MessageBox.Icon.ERROR);
				}
			});
		},
		onBeforeUploadStarts: function (oEvent) {
			var oModel = this.getView().getModel();
			var csrf = oModel.getSecurityToken();

			// Header Token
			var oCustomerHeaderToken = new sap.m.UploadCollectionParameter({
				name: "x-csrf-token",
				value: csrf
			});
			var fiwext = oEvent.getParameter("fileName").split(".");
			//var fileName = appprefix +" "+ item + " "+fiwext[0];
			//ZBIL Changes		
			var typeModel = this.getOwnerComponent().getModel("typeModel");
			var type = typeModel.getProperty("/type");
			if (type == "ZBIL") {
				var ctx = this._oAttSrc.getParent().getBindingContext("SettlementModelZbil").getObject();
				var knumh = ctx.Vbeln;
			} else {
				var ctx = this._oAttSrc.getParent().getBindingContext("SettlementModel").getObject();
				var knumh = ctx.CondRecNum;
			}
			//12/05/2020


			// Header Slug
			var filename = "";
			if (fiwext.length > 2) {
				for (var i = 0; i < fiwext.length - 1; i++) {
					if (i == 0)
						filename = filename + fiwext[i];
					else
						filename = filename + "." + fiwext[i];
				}

			} else
				filename = fiwext[0];
			if (this.getView().getModel("Flags").getData().Park === "X") {
				var Seqno = ctx.Seqno;
			}
			else {
				var Seqno = ctx.seqno;
			}
			var oCustomerHeaderSlug = new sap.m.UploadCollectionParameter({
				name: "slug",
				value: ctx.ContNum + "/" + ctx.ContractType + "/" + knumh + "/" + Seqno + "/" + encodeURIComponent(filename) + "/" + fiwext[fiwext.length - 1]
			});
			oEvent.getParameters().addHeaderParameter(oCustomerHeaderToken);
			oEvent.getParameters().addHeaderParameter(oCustomerHeaderSlug);
			sap.ui.core.BusyIndicator.show();
		},
		//added Mwsbk(taxamount) field code in below function by madhavi on 19/1/2023
		//validate data 
		onValidationDeduction: function (evt) {
			//declaration
			var ChildArray = [];
			var oModel = this.getOwnerComponent().getModel();
			//get the data
			var SettlementModel = this.getView().getModel("SettlementModel");
			var kData = SettlementModel.getData();
			//head property
			var Oproperties = {
				"ContNum": kData[0].ContNum
			};

			//line Item Properties
			for (var i = 0; i < kData.length; i++) {
				var Amount;
				var Mwsbk;
				if (kData[i].Amount === "" || kData[i].Mwsbk === "" ) {
					Amount = "0";
					Mwsbk = "0" ;
				} else {
					Amount = kData[i].Amount.toString();
					Mwsbk = kData[i].Mwsbk.toString();
				}
				var ChildOproperties = {
					"SettledAmt": kData[i].SettledAmt,
					"OpenAccrAmt": kData[i].OpenAccrAmt,
					"Amont": Amount,
					"Taxamount":Mwsbk,
					"ActualAccruals": kData[i].ActualAccruals,
					"ToBeSettled": kData[i].ToBeSettled,
					"ContNum": kData[i].ContNum,
					"CondType": kData[i].CondType,
					"CustName": kData[i].CustName,
					"AccrualCurr": kData[i].AccrualCurr,
					"Kunnr": kData[i].Kunnr,
					"ContractType": kData[i].ContractType,
					"CondKeyComDesc": kData[i].CondKeyComDesc,
					"DeductionNumber": kData[i].DeductionNumber,
					"CondRecNum": kData[i].CondRecNum,
					"CondTabDesc": kData[i].CondTabDesc,
					"CondRecCust4AO": kData[i].CondRecCust4AO,
					// "Seqno": kData[i].seqno.toString(),
					"SettlCust": kData[i].SettlCust,
					"AccountingDoc": kData[i].AccountingDoc

				};
				ChildArray.push(ChildOproperties);
			}
			sap.ui.core.BusyIndicator.show();
			Oproperties.SettlDataValidations_Navi = ChildArray;
			//backend call
			oModel.create("/SettlementDataValidationsHeadSet", Oproperties, {
				success: function (data, response) {
					//data
					sap.ui.core.BusyIndicator.hide();
					var flagsModel = this.getView().getModel("Flags");
					flagsModel.setProperty("/AmountValidation", "X");
					var jData = data.SettlDataValidations_Navi.results;
					var items = this.getView().byId("SettlementPopup").getItems();
					var ErrorWarningCount = 0,
						errorCountFlag = 0;

					//show the message on the basis of color
					for (var j = 0; j < jData.length; j++) {
						items[j].removeStyleClass("redBackground");
						items[j].removeStyleClass("orangeBackground");
						if (jData[j].MesageType === "W") {
							items[j].addStyleClass("orangeBackground");
							ErrorWarningCount++;
						} else if (jData[j].MesageType === "E") {
							items[j].addStyleClass("redBackground");
							ErrorWarningCount++;
							errorCountFlag++;
						} else if (jData[j].MesageType === "S") {
							items[j].removeStyleClass("orangeBackground");
							items[j].removeStyleClass("redBackground");
							for (var value = 0; value < 15; value++) {
								items[j].getCells()[value].setAggregation("tooltip", "");
							}
						}

						for (var value = 0; value < 15; value++) {
							items[j].getCells()[value].setAggregation("tooltip", jData[j].Message);
						}

					}
					if (errorCountFlag === 0) {
						if (ErrorWarningCount === 0) {
							for (var m = 0; m < jData.length; m++) {
								items[m].removeStyleClass("orangeBackground");
								items[m].removeStyleClass("redBackground");
								for (var value = 0; value < 15; value++) {
									items[m].getCells()[value].setAggregation("tooltip", "");
								}
							}

							var msg = Formatter.i18nBundle("VALIDATIONSUCCESS", this);
							var title = Formatter.i18nBundle("SUCCESS", this);
							sap.m.MessageBox.show(msg, "SUCCESS", title);

						}
						flagsModel.setProperty("/AmountValidation", "");
					}

				}.bind(this),
				error: function (error) { }
			});

		},

		// onValidationDeduction: function (evt) {
		// 	var ArrayMsg = [];
		// 	//ZBIL Changes			
		// 	try {
		// 		var typeModel = this.getOwnerComponent().getModel("typeModel");
		// 		var type = typeModel.getProperty("/type");
		// 		var amount = 0;
		// 		var FlagsModel = this.getView().getModel("Flags");
		// 		var validationError = "";
		// 		var deduction = "";
		// 		var errorDeductionNumber = "";
		// 		var SumOfDeductions = [];
		// 		var SumOfOpenDed = [];
		// 		var OpenDeductions = [];
		// 		var errorConditionType = "";
		// 		var errorContractNum = "";
		// 		var errorCondRecNum = "";
		// 		var errorOpenAmount = "";
		// 		if (type == "ZBIL") {
		// 			var SettlementModel = this.getView().getModel("SettlementModelZbil");
		// 			var id = "SettlementPopup1";
		// 		} else {
		// 			var SettlementModel = this.getView().getModel("SettlementModel");
		// 			var id = "SettlementPopup";
		// 		}
		// 		SettlementModel.refresh();
		// 		var SettlementData = SettlementModel.getData();
		// 		var DeductionsModel = this.getOwnerComponent().getModel("DeductionsModel");
		// 		var DeductionsData = DeductionsModel.getData();
		// 		var items = this.getView().byId(id).getItems();
		// 		if (items) {
		// 			for (var i = 0; i < items.length; i++) {
		// 				var aCells = items[i].getCells();
		// 				items[i].removeStyleClass("redBackground");
		// 				items[i].removeStyleClass("orangeBackground");
		// 				for (var value = 0; value < 15; value++) {
		// 				this.getView().byId(id).getItems()[i].getCells()[value].setAggregation("tooltip", "");

		// 				}

		// 			}
		// 		}
		// 		var errCountLoop = 0;
		// 		for (var i = 0; i < SettlementData.length; i++) {
		// 			//this.getView().byId(id).getItems()[i].getCells()[15].setProperty("text", "");

		// 			if (SettlementData[i].Amount && (SettlementData[i].Amount != "0" && SettlementData[i].Amount != "0.00" && SettlementData[i].Amount !=
		// 					"0.00")) {

		// 				if (type != "ZBIL") {
		// 					// if (SettlementData[i].Material) {

		// 					var deductionNumber = SettlementData[i].DeductionNumber;
		// 					var knumh = SettlementData[i].CondRecNum;
		// 					var arr = jQuery.grep(SumOfDeductions, function (n, i) {
		// 						return n.DeductionNumber == deductionNumber;
		// 					});

		// 					if (SettlementData[i].Seqno) {
		// 						SettlementData[i].seqno = SettlementData[i].Seqno;
		// 					}
		// 					if (arr.length == 0) {
		// 						SumOfDeductions.push({
		// 							"DeductionNumber": SettlementData[i].DeductionNumber,
		// 							"Amount": SettlementData[i].Amount,
		// 							"OpenAccrAmt": SettlementData[i].OpenAccrAmt,
		// 							"Key": SettlementData[i].seqno.toString(),
		// 							"knumh": SettlementData[i].CondRecNum
		// 						});

		// 					} else {
		// 						var amount = parseFloat(arr[0].Amount) + parseFloat(SettlementData[i].Amount);
		// 						arr[0].Amount = amount.toString();
		// 						//arr[i].Amount = arr[0].Amount;
		// 						SumOfDeductions.push({
		// 							"DeductionNumber": SettlementData[i].DeductionNumber,
		// 							"Amount": amount.toString(),
		// 							"OpenAccrAmt": SettlementData[i].OpenAccrAmt,
		// 							"Key": SettlementData[i].seqno.toString(),
		// 							"knumh": SettlementData[i].CondRecNum
		// 						});
		// 					}

		// 					var openDedArr = jQuery.grep(SumOfOpenDed, function (n, i) {
		// 						return n.DeductionNumber == deductionNumber;
		// 					});

		// 					if (openDedArr.length == 0) {
		// 						SumOfOpenDed.push({
		// 							"DeductionNumber": SettlementData[i].DeductionNumber,
		// 							"Amount": SettlementData[i].Amount,
		// 							"OpenAccrAmt": SettlementData[i].OpenAccrAmt,
		// 							"Key": SettlementData[i].seqno.toString(),
		// 							"knumh": SettlementData[i].CondRecNum
		// 						});

		// 					} else {
		// 						// var amount = parseFloat(openDedArr[0].Amount) + parseFloat(SettlementData[i].Amount);
		// 						// openDedArr[0].Amount = amount.toString();
		// 						SumOfOpenDed.push({
		// 							"DeductionNumber": SettlementData[i].DeductionNumber,
		// 							"Amount": SettlementData[i].Amount,
		// 							"OpenAccrAmt": SettlementData[i].OpenAccrAmt,
		// 							"Key": SettlementData[i].seqno.toString(),
		// 							"knumh": SettlementData[i].CondRecNum
		// 						});
		// 						//red field

		// 					}

		// 					// } else {
		// 					// 	var msg = Formatter.i18nBundle("MATERIALMANDAT", this);
		// 					// 	sap.m.MessageBox.show(msg, "ERROR");
		// 					// 	return;
		// 					// }
		// 				} else {
		// 					var deductionNumber = SettlementData[i].DeductionNumber;
		// 					var Vbeln = SettlementData[i].Vbeln;
		// 					var arr = jQuery.grep(SumOfDeductions, function (n, i) {
		// 						return n.DeductionNumber == deductionNumber && Vbeln == n.Vbeln;
		// 					});

		// 					if (arr.length == 0) {
		// 						SumOfDeductions.push({
		// 							"DeductionNumber": SettlementData[i].DeductionNumber,
		// 							"Amount": SettlementData[i].Amount,
		// 							"OpenAccrAmt": SettlementData[i].OpenAccrAmt,
		// 							"Key": SettlementData[i].seqno.toString(),
		// 							"Vbeln": SettlementData[i].Vbeln
		// 						});

		// 					} else {
		// 						amount = parseFloat(arr[0].Amount) + parseFloat(SettlementData[i].Amount);
		// 						arr[0].Amount = amount.toString();
		// 							SumOfDeductions.push({
		// 							"DeductionNumber": SettlementData[i].DeductionNumber,
		// 							"Amount": amount.toString(),
		// 							"OpenAccrAmt": SettlementData[i].OpenAccrAmt,
		// 							"Key": SettlementData[i].seqno.toString(),
		// 							"Vbeln": SettlementData[i].Vbeln
		// 						});
		// 					}
		// 				}
		// 			} else {
		// 				//here code
		// 				ArrayMsg[i] = Formatter.i18nBundle("AMOUNTZERO", this);
		// 				//sap.m.MessageBox.show(msg, "ERROR");
		// 				//this.getView().getModel("SettlementModel").getData()[i].ErrorMsg = msg;
		// 				for (var value = 0; value < 15; value++) {

		// 					this.getView().byId(id).getItems()[i].getCells()[value].setAggregation("tooltip", ArrayMsg[i]);

		// 				}
		// 				//this.getView().byId("SettlementPopup").getItems()[i].getCells()[15].setProperty("text", ArrayMsg[i]);
		// 				items[i].addStyleClass("redBackground");
		// 				errCountLoop++;

		// 			}

		// 		}
		// 		if (errCountLoop !== 0) {
		// 			return;
		// 		}

		// 		//First Valudation Sum of Deductions
		// 		var sumerr = "";
		// 		var openerr = "";
		// 		var validationError = "";
		// 		var oModel = this.getOwnerComponent().getModel();
		// 		var data = this.getOwnerComponent().getModel("SettlementModel").getData();
		// 		var oneStepFlag = 0,
		// 			temp = 0;
		// 		var successFlag = 0;
		// 		var ErrorCountFlag = 0;
		// 		var warningCountFlag = 0;
		// 		for (var i = 0; i < SumOfDeductions.length; i++) {

		// 			//check one step 
		// 			if (data[i].ContractType) {
		// 				var conType = data[i].ContractType;
		// 			}
		// 			oModel.read("/IdentifyOneStepScenarioSet('" + conType + "')", {
		// 				method: "GET",

		// 				success: function (odata, response) {
		// 					// if (odata.Identifier === "X") {
		// 					// 	oneStepFlag++;
		// 					// }
		// 					sumerr = "";
		// 					openerr = "";
		// 					validationError = "";
		// 					if (temp < SumOfDeductions.length) {

		// 						var arr = jQuery.grep(DeductionsData, function (n, z) {
		// 							return Formatter.removeZero(n.ClearDocNum) == SumOfDeductions[temp].DeductionNumber;
		// 						});

		// 						if (arr.length == 0) {
		// 							var arr = jQuery.grep(DeductionsData, function (n, z) {
		// 								return Formatter.removeZero(n.DeductionNumber) == SumOfDeductions[temp].DeductionNumber;
		// 							});
		// 						}

		// 						if (arr.length > 0) {
		// 							if (arr[0].BlockInd == "NO" || !arr[0].BlockInd) {
		// 								if (odata.Identifier === "X") {
		// 									oneStepFlag++;

		// 									if (parseFloat(arr[0].ToBeSettled) < parseFloat(SumOfDeductions[temp].Amount)) {
		// 										validationError = "X";
		// 										if (parseFloat(arr[0].ToBeSettled) < parseFloat(SumOfDeductions[temp].Amount))
		// 											sumerr = "X";

		// 										errorDeductionNumber = SumOfDeductions[temp].DeductionNumber;
		// 										var seqno = SumOfDeductions[temp].Key;
		// 										for (var j = 0; j < items.length; j++) {
		// 											var aCells = items[j].getCells();
		// 											if (type == "ZBIL") {
		// 												var value = aCells[7].getValue();
		// 												var value1 = aCells[11].getText();
		// 											} else {
		// 												var value = aCells[8].getValue();
		// 												var value1 = aCells[16].getText();
		// 											}
		// 											if (value == errorDeductionNumber && seqno == value1) {
		// 												if (sumerr == "X" && openerr !== "X")
		// 													items[j].addStyleClass("redBackground");
		// 												//error message in the column

		// 											}
		// 										}
		// 									}
		// 								} else {
		// 									if (parseFloat(arr[0].ToBeSettled) < parseFloat(SumOfDeductions[temp].Amount) || parseFloat(SumOfDeductions[temp].OpenAccrAmt) <
		// 										parseFloat(SumOfDeductions[temp].Amount)) {
		// 										validationError = "X";
		// 										if (parseFloat(arr[0].ToBeSettled) < parseFloat(SumOfDeductions[temp].Amount))
		// 										{
		// 											sumerr = "X";
		// 										}
		// 										if (parseFloat(SumOfOpenDed[temp].OpenAccrAmt) < parseFloat(SumOfOpenDed[temp].Amount))
		// 										{
		// 											openerr = "X";
		// 											validationError = "";

		// 										}
		// 										// if (parseFloat(arr[0].ToBeSettled) > parseFloat(SumOfDeductions[temp].Amount) && parseFloat(SumOfDeductions[temp].OpenAccrAmt) <
		// 										// parseFloat(SumOfDeductions[temp].Amount)) 
		// 										// {
		// 										// validationError = "";	
		// 										// }
		// 										errorDeductionNumber = SumOfDeductions[temp].DeductionNumber;
		// 										var seqno = SumOfDeductions[temp].Key;
		// 										for (var j = 0; j < items.length; j++) {
		// 											var aCells = items[j].getCells();
		// 											if (type == "ZBIL") {
		// 												var value = aCells[7].getValue();
		// 												var value1 = aCells[11].getText();
		// 											} else {
		// 												var value = aCells[8].getValue();
		// 												var value1 = aCells[16].getText();
		// 											}
		// 											if (value == errorDeductionNumber && seqno == value1) {
		// 												if (sumerr == "X" && openerr !== "X")
		// 													items[j].addStyleClass("redBackground");
		// 											}
		// 										}
		// 									}
		// 								}
		// 							} else {

		// 								var titleMsg = Formatter.i18nBundleWithParams("BLOCKEDIND", SumOfDeductions[temp].DeductionNumber, this);
		// 								sap.m.MessageBox.show(titleMsg, "ERROR");
		// 								return false;
		// 							}
		// 						}
		// 					}
		// 					//code
		// 					//	if (i === SumOfDeductions.length && temp === i - 1) {
		// 					// for (var p = 0; p < SumOfOpenDed.length; p++) {
		// 					var p = temp;
		// 					var arr = jQuery.grep(DeductionsData, function (n, z) {
		// 						return Formatter.removeZero(n.ClearDocNum) == SumOfOpenDed[p].DeductionNumber;
		// 					});

		// 					if (arr.length == 0) {
		// 						var arr = jQuery.grep(DeductionsData, function (n, z) {
		// 							return Formatter.removeZero(n.DeductionNumber) == SumOfDeductions[p].DeductionNumber;
		// 						});
		// 					}

		// 					if (arr.length > 0) {
		// 						if (parseFloat(arr[0].ToBeSettled) < parseFloat(SumOfDeductions[p].Amount)) {
		// 							validationError = "X";
		// 							if (parseFloat(arr[0].ToBeSettled) < parseFloat(SumOfDeductions[p].Amount))
		// 								sumerr = "X";
		// 							if (parseFloat(SumOfOpenDed[p].OpenAccrAmt) < parseFloat(SumOfOpenDed[p].Amount))
		// 							{
		// 								if(odata.Identifier === "")
		// 								{
		// 								openerr = "X";
		// 								}

		// 								validationError = "";
		// 							}

		// 							errorDeductionNumber = SumOfOpenDed[p].DeductionNumber;
		// 							var seqno = SumOfOpenDed[p].Key;
		// 							for (var k = 0; k < items.length; k++) {
		// 								var aCells = items[k].getCells();
		// 								if (type == "ZBIL") {
		// 									var value = aCells[7].getValue();
		// 									var value1 = aCells[11].getText();
		// 								} else {
		// 									var value = aCells[8].getValue();
		// 									var value1 = aCells[16].getText();
		// 								}
		// 								if (value == errorDeductionNumber && seqno == value1) {
		// 									if (sumerr == "X" && openerr !== "X")
		// 										items[k].addStyleClass("redBackground");

		// 								}
		// 							}
		// 						}

		// 					}
		// 					// }
		// 					if ((validationError && openerr !== "X") || (validationError && sumerr === "X"))
		// 						FlagsModel.setProperty("/AmountValidation", "X");
		// 					else
		// 						FlagsModel.setProperty("/AmountValidation", "");
		// 					if (validationError !== "X") {
		// 					successFlag++;

		// 					} 

		// 						if (openerr === "X" && oneStepFlag === 0) {

		// 							//	var msg = Formatter.i18nBundle("OPENACCRUALERROR", this);
		// 							//sap.m.MessageBox.show(msg, "WARNING");
		// 							//yellow
		// 								var typeModel = this.getOwnerComponent().getModel("typeModel");
		// 						var ClDocType = typeModel.getProperty("/ClDocType");
		// 							warningCountFlag++;
		// 							items[temp].addStyleClass("orangeBackground");

		// 							ArrayMsg[temp] = Formatter.i18nBundle("OPENACCRUALERROR", this);
		// 							for (var value = 0; value < 15; value++) {
		// 								this.getView().byId(id).getItems()[temp].getCells()[value].setAggregation("tooltip", ArrayMsg[temp]);
		// 							}
		// 							//this.getView().byId("SettlementPopup").getItems()[temp].getCells()[15].setProperty("text", ArrayMsg[temp]);
		// 						}

		// 						if (sumerr === "X") {
		// 								var typeModel = this.getOwnerComponent().getModel("typeModel");
		// 						var ClDocType = typeModel.getProperty("/ClDocType");
		// 							//var msg = Formatter.i18nBundle("DEDUCTIONSUMERROR", this);
		// 							//sap.m.MessageBox.show(msg, "ERROR");
		// 							//red background do
		// 							ErrorCountFlag++;
		// 							items[temp].addStyleClass("redBackground");
		// 							items[temp].removeStyleClass("orangeBackground");
		// 							if (ArrayMsg[temp]) {
		// 								//add to column
		// 								ArrayMsg[temp] = ArrayMsg[temp]  + " & " + Formatter.i18nBundle("DEDUCTIONSUMERROR", this);
		// 							} else {
		// 								ArrayMsg[temp] = Formatter.i18nBundle("DEDUCTIONSUMERROR", this);

		// 							}
		// 							for (var value = 0; value < 15; value++) {
		// 								//this.getView().byId("SettlementPopup").getItems()[temp].getCells()[15].setProperty("text", ArrayMsg[temp]);

		// 							this.getView().byId(id).getItems()[temp].getCells()[value].setAggregation("tooltip", ArrayMsg[temp]);
		// 								}

		// 						}

		// 					if (successFlag >= SumOfDeductions.length && ErrorCountFlag ===0 &&warningCountFlag === 0) {
		// 						for (var h = 0; h < items.length; h++) {
		// 							var aCells = items[h].getCells();
		// 							items[h].removeStyleClass("redBackground");
		// 							items[h].removeStyleClass("orangeBackground");
		// 							var tooltip = this.getView().byId(id).getItems()[h].getCells();
		// 							for (var value = 0; value < 15; value++) {
		// 								this.getView().byId(id).getItems()[h].getCells()[value].setAggregation("tooltip", "");

		// 							}

		// 						}
		// 						var msg = Formatter.i18nBundle("VALIDATIONSUCCESS", this);
		// 						var title = Formatter.i18nBundle("SUCCESS", this);
		// 						sap.m.MessageBox.show(msg, "SUCCESS", title);
		// 						FlagsModel.setProperty("/AmountValidation", "");
		// 					}
		// 					if(ErrorCountFlag >0)
		// 					{
		// 						FlagsModel.setProperty("/AmountValidation", "X");	
		// 					}

		// 					temp = temp + 1;

		// 				}.bind(this),
		// 				error: function (oError) {
		// 					temp = temp + 1;
		// 				}
		// 			});

		// 		}

		// 	} catch (e) {

		// 	}
		// },
		//Deduction Popup Table
		handleValueHelpTable: function (oEvent) {

			// var sInputValue = this.byId("productInput").getValue(),

			var oModel = this.getView().getModel();
			this.inputId = oEvent.getSource();
			var aFilters = [];
			var oSuccess = function (response) {
				sap.ui.core.BusyIndicator.hide();
				var DeductionNumbers = [];

				var DeductionsModel = this.getOwnerComponent().getModel("DeductionsModel");

				if (!this._oValueHelpDialogTable) {
					this._oValueHelpDialogTable = sap.ui.xmlfragment(
						"itelligence.deductionManagement.fragment.Deductions",
						this
					);
					this.getView().addDependent(this._oValueHelpDialogTable);
				}
				this._oValueHelpDialogTable.getBinding("items").filter([]);
				// var items = DeductionsModel.getData();
				this._oDeductionitems = $.extend(true, [], DeductionsModel.getData());

				for (var i = 0; i < this._oDeductionitems.length; i++) {
					var ctx = this._oDeductionitems[i];
					if (type == "ZBIL") {
						DeductionNumbers.push(ctx);
					} else {
						var arr = jQuery.grep(response.results, function (n, i) {
							return ctx.Kunnr == n.BVPartner;
						});

						if (arr.length > 0)
							DeductionNumbers.push(ctx);
					}

				}
				var inputData = [];
				for (var k = 0; k < DeductionNumbers.length; k++) {
					inputData.push(DeductionNumbers[k].ClearDocNum.replace(/^0+/, ""));
				}
				var dataFilter = inputData.toString();
				var newFilter = [];
				newFilter.push(new Filter("Input", FilterOperator.EQ, dataFilter));
				//Backend call : 11/05/2020
				var that = this;
				oModel.read("/ClearDocSelectSet", {
					filters: newFilter,
					method: "GET",
					success: function (oData) {
						DeductionsModel.setData(oData.results);
						that._oValueHelpDialogTable.setModel(DeductionsModel, "DeductionsModel");
						that._oValueHelpDialogTable.getModel("DeductionsModel").refresh(true);
						that._oValueHelpDialogTable.open();
						var msg = Formatter.i18nBundle("SELECTDEDUCTION", that);
						var msg1 = Formatter.i18nBundle("FORCUSTOMER", that);
						msg = msg + "  " + msg1 + "  " + title;
						that._oValueHelpDialogTable.setTitle(msg);
					},
					error: function (oError) {
					}
				});


				// DeductionsModel.setData([]);

			}.bind(this);
			var oError = function (oError) {
				sap.ui.core.BusyIndicator.hide();
				var oXmlData = oError.response.body;
				var oXMLModel = new sap.ui.model.xml.XMLModel();
				oXMLModel.setXML(oXmlData);
				var otext = oXMLModel.getProperty("/message");
				sap.m.MessageBox.show(otext, sap.m.MessageBox.Icon.ERROR);
			};

			var typeModel = this.getOwnerComponent().getModel("typeModel");
			var type = typeModel.getProperty("/type");

			if (type == "ZBIL") {

				var ctx = oEvent.getSource().getBindingContext("SettlementModelZbil").getObject();
				var SettlementModel = this.getView().getModel("SettlementModelZbil");
				var settlementData = SettlementModel.getData();
				var title = ctx.Kunrg;
			} else {
				var ctx = oEvent.getSource().getBindingContext("SettlementModel").getObject();
				var SettlementModel = this.getView().getModel("SettlementModel");
				var settlementData = SettlementModel.getData();
				var title = ctx.Kunnr;
			}

			aFilters.push(new sap.ui.model.Filter("ContNum", "EQ", ctx.ContNum));

			oModel.read("/DWB_Cont_BV_PartnersSet", {
				method: "GET",
				filters: aFilters,
				success: oSuccess,
				error: oError
			});

		},

		onParkSettlement: function (oEvent) {
			var flagModel = this.getView().getModel("flagModel");
			if (!this._oValueHelpDialogComments) {
				this._oValueHelpDialogComments = sap.ui.xmlfragment(
					"itelligence.deductionManagement.fragment.comments",
					this
				);
				this.getView().addDependent(this._oValueHelpDialogComments);
			}
			flagModel.setProperty("/Comments", "");
			this._oValueHelpDialogComments.setModel(flagModel, "flagModel");
			this._oValueHelpDialogComments.open();

		},

		onCommentsDialogClose: function (oEvent) {
			if (this._oValueHelpDialogComments) {
				this._oValueHelpDialogComments.close();
			}
		},
		//Zpro settlement Create
		onSettlementCreate: function (oEvent) {

			if (this._oValueHelpDialogComments) {
				this._oValueHelpDialogComments.close();
			}
			var model = this.getView().getModel("SettlementModel");
			var data = $.extend(true, [], model.getData());
			var tab = this.getView().byId("accrTable");
			var oFCL = this.oView.getParent().getParent();
			var fistView = oFCL.getBeginColumnPages()[1];
			var finalObject = {};
			// var flagsModel = this.getView().getModel("Flags");
			var finalArray = [];
			var finId = oEvent.getSource().getId();
			if (this.errorExists != "X") {
				for (var i = 0; i < data.length; i++) {
					finalObject = data[i];
					finalObject.Amount = "" + finalObject.Amount;
					finalObject.SettledAmt = finalObject.Amount;
					if (finalObject.seqno) {
						var num = finalObject.seqno;
						finalObject.Seqno = num.toString();
					}
					if (finalObject.Amount == "0.00" || finalObject.Amount == "0" || finalObject.Amount == "0.000") {
						var msg = Formatter.i18nBundle("SETTLEMENTAMOUNZERO", this);
						sap.m.MessageBox.show(msg, "ERROR");
						return;
					}
					var flagsModel = this.getView().getModel("flagModel");
					var comments = flagsModel.getProperty("/Comments");

					finalObject.SettlDate = new Date(finalObject.SettlDate);

					delete finalObject.__metadata;
					if (finId.indexOf("Park") !== -1) {
						finalObject.Comments = comments;
						delete finalObject.SettledAmt;
						delete finalObject.seqno;
						finalObject.TotalAccrual = finalObject.ActualAccruals;
						delete finalObject.ActualAccruals;
						delete finalObject.CondTabDesc;
						// delete finalObject.ContractType;

					} else {
						delete finalObject.Amount;
						delete finalObject.ActualAccruals;
						delete finalObject.seqno;
						delete finalObject.Type;
						delete finalObject.CondTabDesc;
						delete finalObject.ContractType;
					}
					finalArray.push(finalObject);

				}

				if (finId.indexOf("Park") !== -1) {
					var oEntry = {
						"Kunnr": "103" //dummy
					};
					oEntry.SettlDataPark_Navi = finalArray;
				} else {
					var oEntry = {
						"ContNum": "103" //dummy
					};
					oEntry.Settl_Create_Promotions_Navi = finalArray;
				}
				var oSuccess = function (results) {
					sap.ui.core.BusyIndicator.hide();
					if (this.fromParked !== "X") {
						this.getView().getModel().refresh();
						// fistView.getModel().refresh();

					}
					var vText = "";
					var that = this;
					for (i = 0; i < results.Settl_Create_Promotions_Navi.results.length; i++) {
						vText = vText + results.Settl_Create_Promotions_Navi.results[i].Message + "\n";
						var TypeMsg, icon;
						if (results.Settl_Create_Promotions_Navi.results[i].Status === "E") {
							TypeMsg = "Error";
							icon = MessageBox.Icon.ERROR;
						}
						else {
							TypeMsg = "Success";
							icon = MessageBox.Icon.SUCCESS;
						}
					}

					MessageBox.show(vText, {
						icon: icon,
						title: TypeMsg,
						actions: [MessageBox.Action.OK],
						onClose: function (sAction) {
							if (sAction == "OK") {
								//14/05/2020
								that.onBack();
							}
						}
					});

					//Refresh DeductionModel

				}.bind(this);

				var successPark = function (results) {
					sap.ui.core.BusyIndicator.hide();

					// this.onPressClose();
					//Refresh DeductionModel
					// var DeductionsModel = this.getOwnerComponent().getModel("DeductionsModel");
					// DeductionsModel.setData([]);
					this.getView().getModel().refresh();
					fistView.getModel().refresh();
					this.fromParked = "X";
					var oTextMsg = Formatter.i18nBundle("PARKED", this);
					if (results.SettlDataPark_Navi.results[0].Message !== "E") {
						MessageToast.show(oTextMsg, {
							duration: 8000
						});
						this.onBackwithoutDel();
					}

				}.bind(this);
				var oError = function (oError) {
					sap.ui.core.BusyIndicator.hide();
					if (oError.name) {
						sap.m.MessageBox.show(oError.name, sap.m.MessageBox.Icon.ERROR);
					} else {
						var oXmlData = oError.responseText;
						var oXMLModel = new sap.ui.model.xml.XMLModel();
						oXMLModel.setXML(oXmlData);
						var otext = oXMLModel.getProperty("/message");
						sap.m.MessageBox.show(otext, sap.m.MessageBox.Icon.ERROR);
					}
				};
				sap.ui.core.BusyIndicator.show();

				if (finId.indexOf("Park") !== -1) {
					this.getView().getModel().create("/SettlementDataParkHeadSet", oEntry, {
						success: successPark,
						error: oError
					});
				} else {
					this.getView().getModel().create("/Settl_Create_Promotions_HeadSet", oEntry, {
						success: oSuccess,
						error: oError
					});
				}
			} else {
				// var msg = Formatter.i18nBundle("CHECKERRORS", this);
				var title = Formatter.i18nBundle("ERROR", this);
				sap.m.MessageBox.show(msg, "ERROR", title);
			}
		},
		onPressCloseWithoutDel: function (oEvent) {

			var table = this.getView().byId("SettlementPopup");
			var Subtotals = this.getOwnerComponent().getModel("subtotals");
			if (Subtotals)
				Subtotals.setData({});
			this.getView().setModel(this.getOwnerComponent().getModel("subtotals"), "Subtotals");
			var items = table.getItems();
			if (items) {
				for (var i = 0; i < items.length; i++) {
					items[i].removeStyleClass("redBackground");
					items[i].removeStyleClass("orangeBackground");
					for (var value = 0; value < 15; value++) {
						this.getView().byId("SettlementPopup").getItems()[i].getCells()[value].setAggregation("tooltip", "");
					}

				}
			}
			var flagsModel = this.getView().getModel("Flags");
			if (flagsModel)
				flagsModel.setProperty("/AmountValidation", "");
			table.removeSelections();


		},

		//ZBIL Changes	 settlement popup close
		onPressClose: function (oEvent) {
			var table = this.getView().byId("SettlementPopup");
			var Subtotals = this.getOwnerComponent().getModel("subtotals");
			if (Subtotals)
				Subtotals.setData({});
			this.getView().setModel(this.getOwnerComponent().getModel("subtotals"), "Subtotals");
			var items = table.getItems();
			if (items) {
				for (var i = 0; i < items.length; i++) {
					items[i].removeStyleClass("redBackground");
					items[i].removeStyleClass("orangeBackground");
					for (var value = 0; value < 15; value++) {
						this.getView().byId("SettlementPopup").getItems()[i].getCells()[value].setAggregation("tooltip", "");
					}

				}
			}
			var flagsModel = this.getView().getModel("Flags");
			if (flagsModel)
				flagsModel.setProperty("/AmountValidation", "");
			table.removeSelections();
			var url = "/DWB_attachments_deleteSet('X')";
			var oModel = this.getView().getModel();
			oModel.remove(url, {
				success: function (response) {

				},
				error: function (oError) {
					sap.ui.core.BusyIndicator.hide();
					var oXmlData = oError.response.body;
					var oXMLModel = new sap.ui.model.xml.XMLModel();
					oXMLModel.setXML(oXmlData);
					var otext = oXMLModel.getProperty("/message");
					sap.m.MessageBox.show(otext, sap.m.MessageBox.Icon.ERROR);
				}
			});

		},
		handleMessagePopoverPress: function (oEvent) {
			var that = this;
			var button = oEvent.getSource();
			var model = oEvent.getSource().getModel("messages");
			var oMessageTemplate = new sap.m.MessageItem({
				type: "{messages>type}",
				title: "{messages>title}",
				counter: "{messages>counter}",
				description: "{messages>description}"
			});

			this.oMessagePopover2 = new sap.m.MessagePopover({
				showHeader: true,
				items: {
					path: "messages>/",
					template: oMessageTemplate
				},
				afterClose: function () {

				}
			}).setModel(model, "messages");

			this.getView().setModel(model, "messages");

			this.oMessagePopover2.close();

			this.oMessagePopover2.toggle(oEvent.getSource());
		},
		//Deduction validation
		onDeductionValidation: function (number, CustomerOnDeduction) {

			try {
				var typeModel = this.getOwnerComponent().getModel("typeModel");
				var type = typeModel.getProperty("/type");
				if (type == "ZBIL") {
					var SettlementModel = this.getView().getModel("SettlementModelZbil");
					var path = this.inputId.getBindingContext("SettlementModelZbil").getPath();
					var Customer = SettlementModel.getProperty(path + "/Kunrg");
				} else {
					var SettlementModel = this.getView().getModel("SettlementModel");
					var path = this.inputId.getBindingContext("SettlementModel").getPath();
					var Customer = SettlementModel.getProperty(path + "/CondRecCust4AO");

				}
				var DeductionsModel = this.getOwnerComponent().getModel("DeductionsModel");
				var data = DeductionsModel.getProperty("/");

				var selectedKey = number;
				//Logic to identify the deductions
				this.DeductionData = [];
				this.errorExists = "";

				//Customer Validation

				if (Customer && CustomerOnDeduction && CustomerOnDeduction !== Customer) {

					var msg = Formatter.i18nBundle("CUSTOMERDIFFERS", this);
					var title = Formatter.i18nBundle("ERROR", this);
					sap.m.MessageBox.show(msg, "ERROR", title);
					this.errorExists = "X";

				} else {
					// this.inputId.setValue("");

				}

			} catch (e) {

			}
			// }
		},
		//ZBIL changes
		onSplitSelected: function (oEvent) {
			//ZBIL changes
			var typeModel = this.getOwnerComponent().getModel("typeModel");
			var type = typeModel.getProperty("/type");
			var SettlementModel, id, model;
			if (type == "ZBIL") {

				SettlementModel = this.getView().getModel("SettlementModelZbil");
				id = "SettlementPopup1";
				model = "SettlementModelZbil";
			} else {
				SettlementModel = this.getView().getModel("SettlementModel");
				id = "SettlementPopup";
				model = "SettlementModel";
			}

			var subtotals = this.getView().getModel("Subtotals");
			var tab = this.getView().byId(id);

			var selectedItems = tab.getSelectedItems();
			for (var a = 0; a < selectedItems.length; a++) {
				if (type == "ZBIL") {
					var path = selectedItems[a].getBindingContext("SettlementModelZbil").getPath();
				} else
					var path = selectedItems[a].getBindingContext("SettlementModel").getPath();
				var object = $.extend(true, {}, SettlementModel.getProperty(path));
				//Sequence increment
				var items = tab.getItems();
				var seqno = items[items.length - 1]._getBindingContext(model).getObject().seqno;
				seqno = parseInt(seqno) + 2;
				object.seqno = seqno;
				//
				if (type == "ZBIL") {
					object.DeductionNumber = "";
					object.Amount = "";
					object.ToBeSettled = "";

				} else {
					object.DeductionNumber = "";
					object.Amount = "";
					object.Material = "";
					object.Maktx = "";
				}

				var accsubtot = parseInt(subtotals.getProperty("/accsubtot")) + parseInt(object.ActualAccruals);
				subtotals.setProperty("/accsubtot", parseFloat(accsubtot).toFixed(2));
				var opensubtot = parseInt(subtotals.getProperty("/opensubtot")) + parseInt(object.OpenAccrAmt);
				subtotals.setProperty("/opensubtot", parseFloat(opensubtot).toFixed(2));
				var netvalue = parseInt(subtotals.getProperty("/netvalue")) + parseInt(object.Netwr);
				subtotals.setProperty("/netvalue", parseFloat(netvalue).toFixed(2));

				if (object.ToBeSettled) {
					var openDeduction = parseFloat(subtotals.getProperty("/openDeduction")) + parseFloat(object.ToBeSettled);
					subtotals.setProperty("/openDeduction", parseFloat(openDeduction).toFixed(2));
				}
				var data = SettlementModel.getData();
				data.push(object);
			}
			// data.sort();

			data.sort(function (a, b) {
				var x = parseInt(a.ContNum);
				var y = parseInt(b.ContNum);
				if (x < y) {
					return -1;
				}
				if (x > y) {
					return 1;
				}
				return 0;
			});

			SettlementModel.refresh(true);
			this.getView().byId(id).removeSelections();

		},
		//Delete split 
		onDeleteSplit: function (oEvent) {
			//ZBIL changes
			var typeModel = this.getOwnerComponent().getModel("typeModel");
			var type = typeModel.getProperty("/type");
			var id, SettlementModel, model;
			if (type == "ZBIL") {
				SettlementModel = this.getView().getModel("SettlementModelZbil");
				model = "SettlementModelZbil";
				id = "SettlementPopup1";
			} else {
				SettlementModel = this.getView().getModel("SettlementModel");
				model = "SettlementModel";
				id = "SettlementPopup";
			}
			var tab = this.getView().byId(id);
			var subtotals = this.getView().getModel("Subtotals");

			var selectedItems = tab.getSelectedItems();
			var remitem = [];
			for (var a = 0; a < selectedItems.length; a++) {
				var path = selectedItems[a].getBindingContext(model).getPath();
				var accsubtot = parseInt(subtotals.getProperty("/accsubtot")) - parseInt(SettlementModel.getProperty(path + "/ActualAccruals"));
				subtotals.setProperty("/accsubtot", parseFloat(accsubtot).toFixed(2));
				var opensubtot = parseInt(subtotals.getProperty("/opensubtot")) - parseInt(SettlementModel.getProperty(path + "/OpenAccrAmt"));
				subtotals.setProperty("/opensubtot", parseFloat(opensubtot).toFixed(2));
				var netvalue = parseInt(subtotals.getProperty("/netvalue")) - parseInt(SettlementModel.getProperty(path + "/Netwr"));
				subtotals.setProperty("/netvalue", parseFloat(netvalue).toFixed(2));
				if (SettlementModel.getProperty(path + "/ToBeSettled")) {
					var openDeduction = parseInt(subtotals.getProperty("/openDeduction")) - parseInt(SettlementModel.getProperty(path +
						"/ToBeSettled"));
					subtotals.setProperty("/openDeduction", parseFloat(openDeduction).toFixed(2));
				}
				if (SettlementModel.getProperty(path + "/Amount")) {
					var amountsubtot = parseInt(subtotals.getProperty("/amountsubtot")) - parseInt(SettlementModel.getProperty(path + "/Amount"));
					subtotals.setProperty("/amountsubtot", parseFloat(amountsubtot).toFixed(2));
				}

				// SettlementModel.setProperty(path, "");
				remitem.push(parseInt(path.substring(1)));

				//tab.removeItem(oEvent.getParameter('listItem'));
			}
			for (var i = remitem.length; i > 0; i--) {
				tab.getModel(model).getData().splice(remitem[i - 1], 1);
			}
			SettlementModel.refresh(true);
			tab.removeSelections();
		},
		// onAfterRendering: function(oEvent) {
		// 	debugger;
		//  	this.getView().byId("AmountId").attachChange(this.onChangeAmount, this);
		// },
		

			onChangeAmount: function(oEvent) {
				for (var i = 0; i < this.getView().getModel("SettlementModel").getData().length; i++) {
					var path = i;
					if (this.getView().getModel("SettlementModel").getData()[i].Amount) {
						var value = parseFloat(this.getView().getModel("SettlementModel").getData()[i].Amount).toFixed(2);
						this.getView().getModel("SettlementModel").setProperty("/" + path + "/Amount", value);
					}
				}
			},
			//below function code is added by madhavi on 19/1/2023
			onChangeTaxamount: function (oEvent) {
				{
					for (var i = 0; i < this.getView().getModel("SettlementModel").getData().length; i++) {
						var path = i;
						if (this.getView().getModel("SettlementModel").getData()[i].Mwsbk) {
							var value = parseFloat(this.getView().getModel("SettlementModel").getData()[i].Mwsbk).toFixed(2);
							this.getView().getModel("SettlementModel").setProperty("/" + path + "/Mwsbk", value);
						}
					}
				}
				},
			onAmountValidation: function (oEvent) {
				//ZBIL changes
				var typeModel = this.getOwnerComponent().getModel("typeModel");
				var type = typeModel.getProperty("/type");
				var id = "SettlementPopup";
				var subtotals = this.getView().getModel("Subtotals");
				//amountsubtot
				var amountsubtot = 0;
				var msg = Formatter.i18nBundle("NUMBERNUMERIC", this);
				var path = parseFloat(oEvent.getSource().getId().split("SettlementPopup-")[1]);
				if (oEvent.getParameter("value") === "") {
					this.getOwnerComponent().getModel("SettlementModel").getData()[path].Amount = 0;
				}
				else {
					this.getView().getModel("SettlementModel").setProperty("/" + path + "/Amount", oEvent.getParameter("value"));
				}
				var value = parseFloat(oEvent.getParameter("value"));

				var items = this.getView().getModel("SettlementModel").getData();
				//items[path].getBindingContext("SettlementModel").setObject(Amount);

				var flagsModel = this.getView().getModel("Flags");

				if (!Number(value)) {
					this.errorExists = "X";
					oEvent.getSource().setValueState("Error");
					oEvent.getSource().setValueStateText(msg);
					oEvent.getSource().setValue("");
					if (items) {

						for (var i = 0; i < items.length; i++) {
							value = items[i].Amount;
							// value = items[i].getBindingContext("SettlementModel").getObject().Amount;
							if (value)
								amountsubtot = parseFloat(amountsubtot) + parseFloat(value);
						}
						if (subtotals)
							subtotals.setProperty("/amountsubtot", parseFloat(amountsubtot).toFixed(2));
					}
					return;
				} else {
					this.errorExists = "";
					oEvent.getSource().setValueState("None");
					if (items) {

						for (var i = 0; i < items.length; i++) {
							value = items[i].Amount;
							// value = items[i].getBindingContext("SettlementModel").getObject().Amount;
							if (value)
								amountsubtot = parseFloat(amountsubtot) + parseFloat(value);
						}
						if (subtotals)
							subtotals.setProperty("/amountsubtot", parseFloat(amountsubtot).toFixed(2));
					}
				}

				//here
				//	this.getOwnerComponent().getModel("SettlementModel").refresh(true);
				flagsModel.setProperty("/AmountValidation", "X");

				// if (items) {

				// 	for (var i = 0; i < items.length; i++) {
				// 			value = items[i].Amount;
				// 		// value = items[i].getBindingContext("SettlementModel").getObject().Amount;
				// 		if (value)
				// 			amountsubtot = parseFloat(amountsubtot) + parseFloat(value);
				// 	}
				// 	if (subtotals)
				// 		subtotals.setProperty("/amountsubtot", parseFloat(amountsubtot).toFixed(2));
				// }
				// var validate = this.getView().byId("validate");
				// validate.onfocus();
			},
			//below function code is added by madhavi on 19/1/2023
			onTaxamountValidation: function (oEvent) {
				//ZBIL changes
				var typeModel = this.getOwnerComponent().getModel("typeModel");
				var type = typeModel.getProperty("/type");
				var id = "SettlementPopup";
				var subtotals = this.getView().getModel("Subtotals");
				//amountsubtot
				var taxamountsubtot = 0;
				var msg = Formatter.i18nBundle("NUMBERNUMERIC", this);
				var path = parseFloat(oEvent.getSource().getId().split("SettlementPopup-")[1]);
				if (oEvent.getParameter("value") === "") {
					this.getOwnerComponent().getModel("SettlementModel").getData()[path].Mwsbk = 0;
				}
				else {
					this.getView().getModel("SettlementModel").setProperty("/" + path + "/Mwsbk", oEvent.getParameter("value"));
				}
				var value = parseFloat(oEvent.getParameter("value"));

				var items = this.getView().getModel("SettlementModel").getData();
				//items[path].getBindingContext("SettlementModel").setObject(Amount);

				var flagsModel = this.getView().getModel("Flags");

				if (!Number(value)) {
					this.errorExists = "X";
					oEvent.getSource().setValueState("Error");
					oEvent.getSource().setValueStateText(msg);
					oEvent.getSource().setValue("");
					if (items) {

						for (var i = 0; i < items.length; i++) {
							value = items[i].Mwsbk;
							// value = items[i].getBindingContext("SettlementModel").getObject().Amount;
							if (value)
							
								taxamountsubtot = taxamountsubtot + value;
						}
						if (subtotals)
							subtotals.setProperty("/taxamountsubtot", parseFloat(taxamountsubtot).toFixed(2));
					}
					return;
				} else {
					this.errorExists = "";
					oEvent.getSource().setValueState("None");
					if (items) {

						for (var i = 0; i < items.length; i++) {
							value = items[i].Mwsbk;
							// value = items[i].getBindingContext("SettlementModel").getObject().Amount;
							if (value)
								taxamountsubtot = parseFloat(taxamountsubtot) + parseFloat(value);
						}
						if (subtotals)
							subtotals.setProperty("/taxamountsubtot", parseFloat(taxamountsubtot).toFixed(2));
					}
				}

				//here
				//	this.getOwnerComponent().getModel("SettlementModel").refresh(true);
				flagsModel.setProperty("/AmountValidation", "X");

				// if (items) {

				// 	for (var i = 0; i < items.length; i++) {
				// 			value = items[i].Amount;
				// 		// value = items[i].getBindingContext("SettlementModel").getObject().Amount;
				// 		if (value)
				// 			amountsubtot = parseFloat(amountsubtot) + parseFloat(value);
				// 	}
				// 	if (subtotals)
				// 		subtotals.setProperty("/amountsubtot", parseFloat(amountsubtot).toFixed(2));
				// }
				// var validate = this.getView().byId("validate");
				// validate.onfocus();
			},
			// Material value help
			handleValueHelpMaterial: function (oEvent) {
				var oModel = this.getView().getModel();
				this.inputId = oEvent.getSource().getId();
				var DeductionsModel = this.getOwnerComponent().getModel("DeductionsModel");
				if (!this._oValueHelpDialogMaterial) {
					this._oValueHelpDialogMaterial = sap.ui.xmlfragment(
						"itelligence.deductionManagement.fragment.Material",
						this
					);
					this.getView().addDependent(this._oValueHelpDialogMaterial);
				}
				this._oValueHelpDialogMaterial.getBinding("items").filter([]);
				this._oValueHelpDialogMaterial.setModel(DeductionsModel, "DeductionsModel");
				this._oValueHelpDialogMaterial.open();
			},
			_valueHelpMatClose: function (oEvent) {
				var oSelectedItems = oEvent.getParameter("selectedItem");
				var productInput = sap.ui.getCore().byId(this.inputId);
				var path = sap.ui.getCore().byId(this.inputId).getBindingContext("SettlementModel").getPath();
				var SettlementModel = this.getView().getModel("SettlementModel");
				productInput.setValue(oSelectedItems.getTitle());
				SettlementModel.setProperty(path + "/Maktx", oSelectedItems.getDescription());

			},

			_valueHelpMatSearch: function (oEvent) {
				var sValue = oEvent.getParameter("value");
				if (sValue) {
					var oFilter = new sap.ui.model.Filter("ISearchString", sap.ui.model.FilterOperator.Contains, sValue.toUpperCase());
					oEvent.getSource().getBinding("items").filter([oFilter], false);
				} else {
					oEvent.getSource().getBinding("items").filter([]);
				}
			},
			handleCloseTableDialog: function (oEvent) {
				try {
					this.errorExists = "";
					var subtotals = this.getView().getModel("Subtotals");
					if (oEvent.getParameter("selectedItem")) {
						var path = oEvent.getParameter("selectedItem").getBindingContext("DeductionsModel").getPath();
						var DeductionsModel = this.getOwnerComponent().getModel("DeductionsModel");
						var object = oEvent.getParameter("selectedItem").getBindingContext("DeductionsModel").getObject();
						var DeductionNumber = Formatter.removeZero(object.ClearDocNum);
						var CustomerOnDeduction = object.Kunnr;
						this.onDeductionValidation(DeductionNumber, CustomerOnDeduction);
						//ZBIL Changes		
						var typeModel = this.getOwnerComponent().getModel("typeModel");
						var type = typeModel.getProperty("/type");

						var path = this.inputId.getBindingContext("SettlementModel").getPath();
						var SettlementModel = this.getView().getModel("SettlementModel");
						var id = "SettlementModel";

						SettlementModel.setProperty(path + "/SettlCust", object.Kunnr);
						if (this.errorExists !== "X") {
							SettlementModel.setProperty(path + "/ToBeSettled", oEvent.getParameter("selectedItem").getBindingContext("DeductionsModel").getObject()
								.ToBeSettled);
							var openDeduction = subtotals.getProperty("/openDeduction");

							if (this.inputId.getBindingContext(id).getObject().ClearDocNum !== DeductionNumber) {
								openDeduction = parseFloat(openDeduction) + parseFloat(oEvent.getParameter("selectedItem").getBindingContext("DeductionsModel")
									.getObject()
									.ToBeSettled);
								subtotals.setProperty("/openDeduction", parseFloat(openDeduction).toFixed(2));
							}
							SettlementModel.setProperty(path + "/AccountingDoc", oEvent.getParameter("selectedItem").getBindingContext("DeductionsModel").getObject()
								.Belnr);
							this.inputId.setValue(DeductionNumber);
						}

					}
					var DeductionsModel = this.getOwnerComponent().getModel("DeductionsModel");
					DeductionsModel.setData(this._oDeductionitems);
				} catch (e) {
					DeductionsModel = this.getOwnerComponent().getModel("DeductionsModel");
				}
			},

			handleSearchTableDialog: function (oEvent) {
				var sValue = oEvent.getParameter("value");
				var oFilter = new Filter("ClearDocNum", sap.ui.model.FilterOperator.Contains, sValue);
				var oBinding = oEvent.getSource().getBinding("items");
				oBinding.filter([oFilter]);
			},
			handleValueHelpSettleDate: function (oEvent) {
				var oModel = this.getView().getModel();
				var inputValue = oEvent.getSource();
				this.InputSettlDate = inputValue;
				var object = inputValue.getBindingContext("SettlementModel").getObject();
				var aFilters = [];
				aFilters.push(new sap.ui.model.Filter("IvNum", "EQ", object.ContNum));
				var oSuccess = function (response) {
					var JsModel = new sap.ui.model.json.JSONModel({});
					JsModel.setData(response.results);
					this.getView().setModel(JsModel, "SettleDateModel");

					if (!this._oSettlDateDialog) {
						this._oSettlDateDialog = sap.ui.xmlfragment("itelligence.deductionManagement.fragment.SettleDate", this);
					}
					this.getView().addDependent(this._oSettlDateDialog);
					this._oSettlDateDialog.open();
				}.bind(this);
				var oError = function () {
					sap.ui.core.BusyIndicator.hide();
					if (oError.name) {
						sap.m.MessageBox.show(oError.name, sap.m.MessageBox.Icon.ERROR);
					} else {
						var oXmlData = oError.responseText;
						var oXMLModel = new sap.ui.model.xml.XMLModel();
						oXMLModel.setXML(oXmlData);
						var otext = oXMLModel.getProperty("/message");
						sap.m.MessageBox.show(otext, sap.m.MessageBox.Icon.ERROR);
					}
				};
				oModel.read("/SettlementDateF4Set", {
					method: "GET",
					filters: aFilters,
					success: oSuccess,
					error: oError
				});

			},
			handleCloseSettlDate: function (oEvent) {
				var SettleDate = oEvent.getParameter("selectedItem").getBindingContext("SettleDateModel").getObject().SettlDate;
				var path = this.InputSettlDate.getBindingContext("SettlementModel").getPath();
				var SettlementModel = this.getView().getModel("SettlementModel");
				SettlementModel.setProperty(path + "/SettlDate", SettleDate);

			}
		});
}, true);    