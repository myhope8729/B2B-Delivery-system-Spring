var searchForm = null;
var gridObj = null;
	
	var lastSel = 0;
	gridObj = $("#grid");
	var ajaxUrl = gridObj.attr("ajaxUrl");
	searchForm = $( gridObj.attr("searchForm") );
	
	CommonGrid.init('grid', {
		url: ajaxUrl,
		postData: searchForm.serializeJSON(),
		datatype: "json",
		colNames:['单据类别 /单据编号', '业务单位', '单据金额(元)', '业务日期',  '单据状态', '操作'],
		colModel:[ 
			      {name:'billTypeName',  index:'billId',	sortable:false,	align:'left', width:150,
			    	  formatter:function(selvalue, option, rowobj) {
			    		  return rowobj.billTypeName + '<br>' + rowobj.billId;
			    	  }
			      }, 
			      {name:'custUserName', index:'custUserName',		sortable:false,	align:'left', width:120,
			    	  formatter:function(selvalue, option, rowobj) {// 付款单, 订货单,退货单,报损单
			    		  if(rowobj.billType == BILL_TYPE_CUSTPAY || rowobj.billType == BILL_TYPE_DING || rowobj.billType == BILL_TYPE_TUI || rowobj.billType == BILL_TYPE_LOSS) { 		
			    			  if(rowobj.custUserId == userId) return '供货方<br>' + rowobj.hostUserName;
			    			  else return '订货方<br>' + rowobj.custUserName;
			    		  }else if(rowobj.billType == BILL_TYPE_RUKU) { 	// 入库单
			    			  return '供货方<br>' + rowobj.hostUserName;
			    		  }else if(rowobj.billType == BILL_TYPE_PRICE) { 	// 调价单
			    			  return rowobj.hostUserName + '<br>' + rowobj.custUserName;
			    		  }else if(rowobj.billType == BILL_TYPE_PAYMENT || rowobj.billType == BILL_TYPE_SALE) { // 货款单,销售单
			    			  return '客户名称<br>' + rowobj.custUserName;
			    		  }else if(rowobj.billType == BILL_TYPE_NOTICE) { 	// 通知单
			    			  return rowobj.hostUserName + '<br>' + '《' + rowobj.custUserName + '》';
			    		  }else if(rowobj.billType == BILL_TYPE_NEWS) { 	// 栏目信息
			    			  return rowobj.hostUserName;
			    		  }
			    		  return rowobj.custUserName;
			    	  }
			      },
			      {name:'totalAmt',  	index:'totalAmt',		sortable:true,	align:'right', width:150,
			    	  formatter:function(selvalue, option, rowobj) {
			    		  if(rowobj.totalAmt != '' && rowobj.totalAmt != undefined) { 		
			    			  var returnStr = '';
			    			  if( parseFloat(rowobj.totalAmt) != parseFloat(rowobj.total2)) returnStr = '<font face="微软雅黑" color="#808080">(' + parseFloat(rowobj.totalAmt)+ ')</font>&nbsp;';
			    			  return returnStr + parseFloat(rowobj.total2);
			    		  }else {
			    			  return '--';
			    		  }
			    	  }		
			      },
			      {name:'arriveDate',   sortable:false,	align:'left', width:100,
			    	  formatter:function(selvalue, option, rowobj) {
			    		  var returnStr = '';
			    		  if(rowobj.billType == BILL_TYPE_RUKU) returnStr = '入库日期'; // 入库单
			    		  else if(rowobj.billType == BILL_TYPE_DING || rowobj.billType == BILL_TYPE_SALE) returnStr = '送货日期'; // 订货单, 销售单
			    		  else if(rowobj.billType == BILL_TYPE_PAYMENT) returnStr = '到账日期'; // 货款单
			    		  else if(rowobj.billType == BILL_TYPE_TUI) returnStr = '退货日期'; // 退货单
			    		  else if(rowobj.billType == BILL_TYPE_NOTICE) returnStr = '发布日期'; // 通知单
			    		  else if(rowobj.billType == BILL_TYPE_LOSS) returnStr = '报损日期'; // 报损单
			    		  returnStr = returnStr + '<br>';
			    		  if(rowobj.arriveDate == '' || rowobj.arriveDate == undefined) returnStr = returnStr + '无';
			    		  else returnStr = returnStr + rowobj.arriveDate;
			    		  
			    		  return returnStr;
			    	  }			    	  
			      },
			      {name:'stateName',  	index:'state',		sortable:true, width:100,	align:'center'},  
			      {
			    	  name: "billtype",	 
			    	  align: "center",  width:100,
			    	  formatter:function(selvalue, option, rowobj) {
			    		  var html = '';
			    		  if(rowobj.billType == BILL_TYPE_CUSTPAY) {// 付款单
			    			  html = '<a href="#">详细</a>'; 
			    		  } else if(rowobj.billType == BILL_TYPE_RUKU) {// 入库单
			    			  html = '<a target="_blank" data-role="button" data-icon="carat-r" data-mini="true" data-iconpos="right" href="Receipt.do?cmd=viewReceipt&billId='+rowobj.billId+'">详细</a>'; 
			    		  } else if(rowobj.billType == BILL_TYPE_DING) {// 订货单 
			    			  html = '<a target="_blank" data-role="button" data-icon="carat-r" data-mini="true" data-iconpos="right"  href="Order.do?cmd=orderView&billId='+rowobj.billId+'">详细</a>'; 
			    		  } else if(rowobj.billType == BILL_TYPE_PRICE) {// 报损单
			    			  html = '<a target="_blank" data-role="button" data-icon="carat-r" data-mini="true" data-iconpos="right"  href="Price.do?cmd=viewPrice&billId='+rowobj.billId+'">详细</a>'; 
			    		  } else if(rowobj.billType == BILL_TYPE_PAYMENT) {// 货款单
			    			  html = '<a target="_blank" data-role="button" data-icon="carat-r" data-mini="true" data-iconpos="right"  href="#">详细</a>';  
			    		  } else if(rowobj.billType == BILL_TYPE_TUI) {// 退货单
			    			  html = '<a target="_blank" data-role="button" data-icon="carat-r" data-mini="true" data-iconpos="right"  href="Return.do?cmd=viewReturn&billId='+rowobj.billId+'">详细</a>'; 
			    		  } else if(rowobj.billType == BILL_TYPE_SALE) {//  销售单
			    			  html = '<a target="_blank" data-role="button" data-icon="carat-r" data-mini="true" data-iconpos="right"  href="Sale.do?cmd=saleView&billId=' + rowobj.billId+'">详细</a>'; 
			    		  } else if(rowobj.billType == BILL_TYPE_NOTICE) {// 通知单
			    			  html = '<a target="_blank" data-role="button" data-icon="carat-r" data-mini="true" data-iconpos="right"  href="#">详细</a>'; 
			    		  } else if(rowobj.billType == BILL_TYPE_LOSS) {// 报损单
			    			  if(rowobj.rbillType == BILL_TYPE_RUKU) {// 入库单
			    				  html = '<a target="_blank" data-role="button" data-icon="carat-r" data-mini="true" data-iconpos="right"  href="#">详细</a>'; 
			    			  }else if(rowobj.rbillType == BILL_TYPE_DING) {// 订货单 
			    				  html = '<a target="_blank" data-role="button" data-icon="carat-r" data-mini="true" data-iconpos="right"  href="#">详细</a>'; 
			    			  }
			    		  } 
			    		  return html;
			    	  }					    	  
			      }			      
			    ],
		height:'100%',
		width:730,
		autowidth:false,
		shrinkToFit: true,
		sortname: 'billId',	    
		pager: '#gridpager',
		rowNum: 10, 
		rownumbers:true
	});


function reloadGrid(){
	jQuery('#grid').jqGrid('setGridParam',{
		page:1, 		
		postData: $('#searchForm').serializeJSON()
	}).trigger('reloadGrid');
}
