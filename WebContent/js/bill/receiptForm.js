var searchForm = null;
var gridObj = null;
var cartGridObj = null;
var addrGridObj = null;
var itemPriceCol = null;
var initGridOption = {};

jQuery(document).ready(function(){
	// get the initialized grid option. Because commongrid's defaultOption is modified already.
	$.extend(true, initGridOption, CommonGrid.defaultOption, {
		page: 1, sortname: '', sortorder: 'asc', rowNum:10000 
	});
	
	itemGridData.colNames.push('item_id');
	itemGridData.colModel.push({name:'itemId', key:true, hidden: true});
	
	cartGridData.colNames.push('item_id');
	cartGridData.colModel.push({name:'itemId', key:true, hidden: true});
	
	initItemGrid();
	initCartGrid();
	
	$("#btnSearch").click(function(){
		gridObj.jqGrid('setGridParam',{
			postData: searchForm.serialize()
		}).trigger('reloadGrid');
	});
	
	
	$(document).on('change', 'input[name=qty]', changeQty);
	$(document).on('change', 'input[name=price2]', changePrice);
	
	$('.cat-menu').each(function(){
		var menuCnt = $(this).find('.col-lg-3').length;
		var cols = parseInt(menuCnt / 4);
		$(this).find('.col-lg-3:gt(' + (cols * 4 - 1) +')').addClass('last-row');
		// For sub category
		var menuCnt = $(this).find('.col-lg-2').length;
		var cols = parseInt(menuCnt / 6);
		$(this).find('.col-lg-2:gt(' + (cols * 6 - 1) +')').addClass('last-row');
	});
	
	// user Item category
	$(document).on('click', 'div.cat-menu-item', function(e) {
		var catName =  $(this).attr("cid");
		
		$(this).siblings().removeClass("active");
		$(this).addClass("active");
		$(this).parent().children('input[type=hidden]').val((catName=="")?"-1":catName);
		$("#btnSearch").trigger('click');
	});
	
	$("#btnDraft").click(function(){
		saveReceiptDraft();
	});
	
	$("#btnSave").click(function(){
		saveReceipt();
	});
});

function initItemGrid()
{
    gridObj = $("#itemGrid");
	var ajaxUrl = gridObj.attr("ajaxUrl");
	searchForm = $( gridObj.attr("searchForm") );
	
	itemGridData.colNames.unshift("图片");
	itemGridData.colModel.unshift( {name: "itemSmallImg", sortable:false, align: "center", width:80, formatter: funcImg} );
	
	gridObj.jqGrid($.extend({}, CommonGrid.defaultOption, {
		url: gridObj.attr("ajaxUrl"),
		datatype: "json",
		keyName : "itemId",
		postData: searchForm.serialize(),
		colNames: itemGridData.colNames,
		colModel: itemGridData.colModel,
		pager: '#itemGridPager',
		sortname: gridPager.sortname || itemGridData.colModel[1].name,
		radioOption:true,
	    onSelectRow: function(id){
			if (id) {
				// check the existence
				var row = gridObj.getRowData(id, true);
				
				var rowTemp = cartGridObj.getRowData(id);
				
				if (rowTemp.itemId != undefined) {
					KptApi.showWarning("该商品已经录入过了");
				} else {
					row.qty = "";
					row.price2 = "";
					cartGridObj.addRowData(id, row);
					calcTotalAmt(id, row);
					cartGridObj.setSelection(id);
				}
			}
		},
		loadCompleteCB: function(data) 
		{
			$("#cat2-wrapper").remove();
			if (data.cat2List && data.cat2List.length > 1){
				var template = '<div class="info-box border" id="cat2-wrapper">\
					<div class="box-title"><label class="title">商品分类 - 小类</label></div>\
					<div class="box-body no-padding">\
						<div class="row">\
							<div class="col-lg-12">\
								<div class="cat-menu" id="cat2">\
								</div>\
							</div>\
						</div>\
					</div>\
				</div>';
				$("#cat-wrapper").after(template);
				for (i=0;i < data.cat2List.length; i++){
					var cat2Data = data.cat2List[i];
					var cat2Name = cat2Data.catName || "";
					var row = '<div class="cat-menu-item col-lg-2';
					if ((cat2Name == "") && data.sc.category2 == "-1"){
						row = row + ' active';
					}else if (cat2Name != "" && data.sc.category2 == cat2Name){
						row = row + ' active';
					}
					row = row + '" cid="'+ cat2Name + '">';
					if (cat2Name == ""){
						row = row + '未分类';
					}else{
						row = row + cat2Name;
					}
					row = row + '(' + cat2Data.cnt + ')</div>';
					$("#cat2").append(row);
				}
				
				var menuCnt = $("#cat2").find('.col-lg-2').length;
				var cols = parseInt(menuCnt / 6);
				if (cols > 0){
					$("#cat2").find('.col-lg-2:gt(' + (cols * 6 - 1) +')').addClass('last-row');
				}else{
					$("#cat2").find('.col-lg-2').addClass('last-row');
				}
				
				
				var category2 = data.sc.category2 || "";
				$("#cat2").append('<input type="hidden" name="category2" id="category2" value="' + category2 + '" />');
			}
		},
		rownumbers:true
	}));
}  

function initCartGrid()
{
	cartGridData.colNames.push("入库价");
	cartGridData.colNames.push("数量");
	cartGridData.colNames.push("金额(元)");
	cartGridData.colNames.push("备注");
	cartGridData.colNames.push("操作");
	
	cartGridData.colModel.push( {
		name: "price2", index: "price2", align : "right", width:120,
		editable:true, editrules:{required:true, number:true, minValue:0}
	});
	
	cartGridData.colModel.push( {
		name: "qty", index: "qty", align : "right", width:120,
		editable:true, editrules:{required:true, number:true, minValue:0}
	});
	cartGridData.colModel.push( {name: "tot", index: "tot", align : "right", width:100} );
	cartGridData.colModel.push( {name: "note", index: "note", editable:true, width:150} );
	cartGridData.colModel.push( {name: "state", index: "state", sortable:false, align: "center", width:80,
		formatter: controlFunc
	} );
	
	cartGridObj = $("#cartGrid");
	cartGridObj.jqGrid($.extend({}, initGridOption, {
		datatype:"local",
		data: billItems,
		colNames: cartGridData.colNames,
		colModel: cartGridData.colModel,
		//sortname: 'bill_id',	    
	    onSelectRow: function(id){
	    	if (id) {
				var row = gridObj.getRowData(id);
				cartGridObj.jqGrid('editRow', id, true);
			}
		},
		loadCompleteCB : function() {
	    	var ids = jQuery('#cartGrid').getDataIDs();
	    	for (var i = ids.length - 1; i >= 0; i--){
	    		jQuery('#cartGrid').jqGrid('editRow', ids[i], {keys:false});
	    	}
	    },
		rownumbers:true,
		rowNum:10000
	}));
}

function imageFunc(cellvalue, options, rowObject){
	return "<img src='" + cellvalue + "' height='32px' />";
}

function controlFunc(cellvalue, options, rowObject) 
{
	return '<a href="javascript: deleteCartItem(\''+options.rowId+'\')">删除</a>	' + 
			'<input type="hidden" name="itemId" value="' + rowObject.itemId + '"/>'+
			'<input type="hidden" name="lastPrice" value="' + rowObject.priceIn + '"/>';
}

function deleteCartItem(rowId)
{
	cartGridObj.delRowData(rowId);
	setTotalPrice();
}

/**
 * @param rowId
 * @param row
 * @returns
 */
function calcTotalAmt(rowId, row)
{
	if (row == undefined)
	{
		row = cartGridObj.getRowData(rowId, true);
	}
	
	if (row.itemId != undefined) {
		var price = row.price2;
		if (!isNumeric(price)) {
			price = 0;
		}
		
		var qty = row.qty;
		
		if (!isNumeric(qty)) {
			qty = 0;
		}
		
		row.tot = Math.round(qty * price * 100)/100;
		if (row.tot == NaN) {
			row.tot = "0";
		}
		cartGridObj.setCell(row.itemId, "tot", row.tot);
	}
	setTotalPrice();
	return row;
}

function setTotalPrice()
{
	var rowIds = cartGridObj.getDataIDs();
	var total_price = 0;
	for (i=0; i< rowIds.length; i++){
		total_price = Math.round((parseFloat(total_price) + parseFloat(cartGridObj.getCell(rowIds[i], "tot"))) * 100) / 100;
	}
	$("#total-amt").html(total_price);
	$("#total_price").val(total_price);
}

function validateForm()
{
	if ($("#paytype").val() == ""){
		KptApi.showInfo("请选择付款方式。");
		$("#paytype").focus();
		return false;
	}
	if ($("#store").val() == ""){
		KptApi.showInfo("请选择入库仓库。");
		$("#store").focus();
		return false;
	}
	if ($("input[name='arriveDate']").val() == ""){
		KptApi.showInfo("请输入入库日期。");
		$("input[name='arriveDate']").focus();
		return false;
	}
	var reccount = cartGridObj.jqGrid("getGridParam", "reccount");
	if (reccount < 1) {
		page = 1;
		KptApi.showInfo(messages.select_one_at_least);
		KptApi.scrollTo($("#itemGrid"), -10);
		return false;
	}
	var rowIds = cartGridObj.getDataIDs();
	for (i=0; i< rowIds.length; i++){
		var rowData = cartGridObj.getRowData(rowIds[i], true);
		if (rowData.price2 == "0" || rowData.price2 == ""){
			KptApi.showError("请输入正确的入库价。");
			cartGridObj.editRow(rowIds[i], {focusField:"price2"});
			return false;
		}
		if (rowData.qty == "0" || rowData.qty == ""){
			KptApi.showError("请输入正确的入库数量。");
			cartGridObj.editRow(rowIds[i], {focusField:7});
			return false;
		}
		
		if (! isNumeric(rowData.qty)) {
			KptApi.showError("请输入正确的数值，只能输入数值。");
			return false;
		}
		
	}
	return true;
}

function changeQty(e)
{
	var obj = $(e.target);
	var rowId = obj.attr("rowId");
	var val = obj.val();
	
	var row = cartGridObj.getRowData(rowId, true);
	row.qty = val;
	
	if (! isNumeric(val)) {
		KptApi.showError("请输入正确的数值，只能输入数值。");
		obj.val("");
		obj.focus();
		return false;
	}
		
	calcTotalAmt(rowId);
}

function changePrice(e)
{
	var obj = $(e.target);
	var rowId = obj.attr("rowId");
	var val = obj.val();
	
	var row = cartGridObj.getRowData(rowId, true);
	row.price2 = val;
	
	if (! isNumeric(val)) {
		KptApi.showError("请输入正确的数值，只能输入数值。");
		obj.val("");
		obj.focus();
		return false;
	}
	
	calcTotalAmt(rowId);
}

function isNumeric(value) {
	return /^-?(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d+)?$/.test(value);
}
/**
 * Save the order.
 */
function saveReceipt()
{
	if (validateForm()){

		var formObj = $("#userItemsForm");
		
		formObj.submit();
		
	}
}

function saveReceiptDraft()
{
	if (validateForm()){
		
		$("#draftFlg").val("Y");
		var formObj = $("#userItemsForm");
		
		formObj.submit();
		
	}
}