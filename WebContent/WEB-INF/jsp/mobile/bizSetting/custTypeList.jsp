<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ include file="/WEB-INF/jsp/common/tagLib.jspf"%>
<%@ page import="com.kpc.eos.core.controller.BaseController"%>

<div data-role="header" data-theme="b" >
    <h3 class="page_title">客户类别目录</h3>
    <a data-theme="b" data-role="button" data-icon="plus" data-inline="true" class="ui-btn-right" data-iconpos="left" href="<%= BaseController.getCmdUrl("CustType", "custTypeForm") %>"> 
    	<qc:message code="system.common.btn.new" /> 
    </a>
</div>
	
<div role="main" class="ui-content">	

	<form name="custTypeListForm" id="custTypeListForm" onsubmit="reloadGrid();return false;"></form>
	
	<table id="grid"></table> 
	<div id="gridpager"></div>
</div>