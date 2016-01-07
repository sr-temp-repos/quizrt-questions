function escattr ( s ) {
	return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#x27;').replace(/\//g,'&#x2F;') ;
}

var wdq = {

	steptypes : {
/*		none : {
			label : "Not specified" ,
			desc : "Please chose a condition here"
		} , */
		claim : {
			label : "Claim" ,
			desc : "have <i>any</i> of the following claims"
		} , 
		noclaim : {
			label : "No claim" ,
			desc : "have <i>none</i> of the following claims"
		} , 
		tree : {
			label : "Tree" ,
			desc : "are in a \"property tree\" around root item(s)"
		}
	} ,

	steps : [] ,
	wd:'' ,
	helper:0 ,
	max_level:5 ,
	wqapi:'http://wdq.wmflabs.org/api' ,
	
	generateButton : function ( o ) {
		var h = '' ;
		h += "<button class='btn " + (o.c||'') + "' onclick='wdq." + o.callback + "(" + o.id + ");return false'" ;
		if ( undefined !== o.desc ) h += ' data-toggle="tooltip" title="' + o.desc + '"' ;
		if ( undefined !== o.notab ) h += " tabindex='-1'" ;
		h += ">" + o.label + "</button>" ;
		return h ;
	} ,
	
	generateEntryBox : function ( o ) {
		var self = this ;
		var h = '' ;

		if ( o.val === undefined && o.helper != 'P' && o.helper != 'Q' ) {
			var i = self.wd.getItem(o.helper) ;
			if ( undefined === i ) o.val = '' ; // Huh?
			else o.val = i.getLabel() ;
		}
		
		h += "<input type='text'" ;
		h += " helper=" + self.helper ;
		h += " datatype='" + o.type + "'" ;
//		h += " title='' data-toggle='tooltip'" ;
		if ( o.val !== undefined ) h += " value='" + o.val.replace(/'/g,'&#39;') + "'" ;
		if ( o.ph !== undefined ) h += " placeholder='" + o.ph + "'" ;
//		h += " onkeyup='wdq." + o.callback + "(this," + o.params + ")'" ;
		h += " class='" ;
		if ( o.type == 'nq' ) h += "nqbox span4" ;
		else h += "entrybox span3" ;
		h += "' id='entrybox" + self.helper + "'" ;
		h += " " + (o.attrs||'') ;
		h += "/>" ;
		
		if ( o.type == 'nq' ) {
			h += "<span style='padding-left:5px' id='helper" + self.helper + "'>" ;
			h += "<a target='_blank' href='?q=" + o.val + "' title='Run a query in a new tab, then copy the query string (text on grey) here.'>Test/edit nested query</a>" ;
			h += "</span>" ;
		} else {
			h += "<span class='helper' id='helper" + self.helper + "'" ;
			if ( o.helper != 'P' && o.helper != 'Q' ) {
				h += " pq='" + o.helper + "'>" ;
				h += self.getPQlink ( o.helper ) ;
			} else h += " pq=''>" ;
			h += "</span>" ;
		}
		
		if ( o.remove ) {
//			h += '&nbsp' ;
			h += self.generateButton ( { callback:'onRemoveTreeElement' , label:'<i class="icon-remove icon-white"></i>' , c:'btn-danger btn-mini' , desc:'Remove this item/property' , notab:1 , id:"this" } ) ;
		}
		
		self.helper++ ;
		
		return h ;
	} ,
	
	generateStep : function ( sid ) {
		var self = this ;
		var step = self.steps[sid] ;
		var h = '' ;
		h += "<div class='qb_step' style='clear:right;border-left:" + (step.level*20) + "px solid #6094DB'>" ;
		h += "<div style='float:right;margin-left:10px;'>" ; // ;text-align:center
		h += self.generateButton ( { callback:'onRemoveStep' , label:'<i class="icon-remove icon-white"></i>' , notab:1 , id:sid , c:'btn-danger' , desc:'Remove this step' } ) ;
		h += "<br/>" ;
		h += self.generateButton ( { callback:'onAddStep' , label:'<i class="icon-plus icon-white"></i>' , id:sid+1 , c:'btn-primary' , desc:'Add a new step after this one' } ) ;
		if ( step.level < self.max_level ) {
			h += "<br/>" + self.generateButton ( { callback:'onAddIndent' , label:'<i class="icon-indent-right"></i>' , id:sid , c:'btn' , desc:'Increase () level' } ) ;
		}
		if ( step.level > 0 ) {
			h += "<br/>" + self.generateButton ( { callback:'onRemoveIndent' , label:'<i class="icon-indent-left"></i>' , id:sid , c:'btn' , desc:'Decrease () level' } ) ;
		}
		h += "</div>" ;
		h += "<form class='form-inline'>" ;
		
		h += "<div style='display:inline'>" ;
		h += "<select name='type' style='margin-right:5px;background-color:#2966B8;font-weight:bold;color:white' class='span2'" ;
		h += " onchange='wdq.onStepOptionChange(this," + sid + ")'>" ;
		$.each ( self.steptypes , function ( k , v ) {
			h += "<option value='" + k + "'" ;
			if ( k == step.type ) h += " selected" ;
			h += ">" + v.label + "</option>" ;
		} ) ;
		h += "</select>" ;
		
		h += "<div style='display:inline'>" ;
		h += "<div style='display:inline'>" + self.steptypes[step.type].desc + "</div>" ;
		if ( step.type != 'none' && sid+1 != self.steps.length ) {
			h += "<span>, <b><i>" ;
			h += "<label class='radio'><input type='radio' name='and_or" + sid + "' value='and' " + (step.con=='and'?'checked':'') + " onchange='wdq.onAndOrChange("+sid+")' sid="+sid+"/>and</label>/" ;
			h += "<label class='radio'><input type='radio' name='and_or" + sid + "' value='or' " + (step.con=='or'?'checked':'') + " onchange='wdq.onAndOrChange("+sid+")' sid="+sid+"/>or</label>" ;
			h += "</i></b></span>" ;
		}
		if ( step.type == 'claim' || step.type == 'noclaim' ) {
			var add_claim = self.generateButton ( { callback:'onAddClaim' , label:'<i class="icon-plus icon-white"></i>' , id:"this,"+sid , c:'btn-primary btn-mini' , desc:'Add a new claim' } ) ;
			var add_nq = self.generateButton ( { callback:'onAddNQ' , label:'(<i class="icon-plus icon-white"></i>)' , id:"this,"+sid , c:'btn-primary btn-mini' , desc:'Add a nested query string' } ) ;
			h += "<br/><div style='display:inline'>" ;
			if ( step.options.claims.length == 0 ) {
				h += "<div class='claimsection'>" + add_claim + add_nq + "</div>" ;
			} else {
				h += "<table class='claims_table table table-striped table-condensed' style='width:auto !important'>" ;
				h += "<thead><tr><th>Property</th><th>Item / Nested query</th></tr></thead>" ;
				h += "<tbody>" ;
				$.each ( step.options.claims , function ( cid , c ) {
					h += "<tr>" ;
					h += "<td>" + self.generateEntryBox ( { type:'prop' , helper:'P'+c.prop , attrs:"sid='"+sid+"' cid='"+cid+"'" , ph:'A PROPERTY IS REQUIRED' } ) + "</td>" ; // callback:'onClaimChange' , 
					if ( c.nq !== undefined ) {
						h += "<td>" + self.generateEntryBox ( { type:'nq' , val:c.nq , attrs:"sid='"+sid+"' cid='"+cid+"'" , ph:'A query string' } ) + "</td>" ; // callback:'onClaimChange' ,  // FIXME
					} else {
						h += "<td>" + self.generateEntryBox ( { type:'item' , helper:'Q'+c.item , attrs:"sid='"+sid+"' cid='"+cid+"'" , ph:'Any item' } ) + "</td>" ; // callback:'onClaimChange' , 
					}
					h += "<td>" + self.generateButton ( { callback:'onRemoveClaim' , label:'<i class="icon-remove icon-white"></i>' , notab:1 , id:"this,"+sid+","+cid , c:'btn-danger btn-mini' , desc:'Remove this claim' } ) ;
					if ( cid+1 == step.options.claims.length ) h += "&nbsp;" + add_claim + "&nbsp;" + add_nq ;
					h += "</td>" ;
					h += "</tr>" ;
				} ) ;
				h += "</tbody></table>" ;
			}
			h += "</div>" ;
		} else if ( step.type == 'tree' ) {
//			var add_claim = self.generateButton ( { callback:'onAddClaim' , label:'<i class="icon-plus icon-white"></i>' , id:"this,"+sid , c:'btn-primary btn-mini' , desc:'Add a new claim' } ) ;
			h += "<div class='claimsection'><b>Root items</b> <i>items from which to start a tree search</i><br/>" ;
			$.each ( step.options.items , function ( iid , i ) {
				h += "<div class='tree_element'>" ;
				h += self.generateEntryBox ( { type:'item' , helper:'Q'+i , attrs:"treeprop='items' sid='"+sid+"' iid='"+iid+"'" , ph:'AN ITEM IS REQUIRED' , remove:true } )
				h += "</div>" ;
			} ) ;
			h += self.generateButton ( { callback:'onAddTreeElement' , label:'<i class="icon-plus icon-white"></i>' , c:'btn-primary btn-mini' , desc:'Add an item' , id:'this,"items",'+sid } ) ;
			h += "</div>" ;
			
			h += "<div class='claimsection'><b>Forward properties</b> <i>follow all of these properties from a root item to a branch, and repeat</i><br/>" ;
			$.each ( step.options.forward , function ( iid , p ) {
				h += "<div class='tree_element'>" ;
				if ( iid > 0 ) h += "<i>or</i>&nbsp;" ;
				h += self.generateEntryBox ( { type:'prop' , helper:'P'+p , attrs:"treeprop='forward' sid='"+sid+"' iid='"+iid+"' dir='forward'" , ph:'A PROPERTY IS REQUIRED' , remove:true } )
				h += "</div>" ;
			} ) ;
			h += self.generateButton ( { callback:'onAddTreeElement' , label:'<i class="icon-plus icon-white"></i>' , c:'btn-primary btn-mini' , desc:'Add an item' , id:'this,"forward",'+sid } ) ;
			h += "</div>" ;

			h += "<div class='claimsection'><b>Reverse properties</b> <i>follow to items that have any of these properties for one of the root items as a claim, and repeat</i><br/>" ;
			$.each ( step.options.reverse , function ( iid , p ) {
				h += "<div class='tree_element'>" ;
				if ( iid > 0 ) h += "<i>or</i>&nbsp;" ;
				h += self.generateEntryBox ( { type:'prop' , helper:'P'+p , attrs:"treeprop='reverse' sid='"+sid+"' iid='"+iid+"' dir='reverse'" , ph:'A PROPERTY IS REQUIRED' , remove:true } )
				h += "</div>" ;
			} ) ;
			h += self.generateButton ( { callback:'onAddTreeElement' , label:'<i class="icon-plus icon-white"></i>' , c:'btn-primary btn-mini' , desc:'Add an item' , id:'this,"reverse",'+sid } ) ;
			h += "</div>" ;
		}
		h += "</div>" ;
		
		h += "</div>" ;
		
		h += "</form>" ;
		h += "</div>" ;
		return h ;
	} ,
	
	onAddIndent : function ( sid ) {
		wdq.steps[sid].level++ ;
		wdq.generateQueryBuilder() ;
	} ,
	
	onRemoveIndent : function ( sid ) {
		wdq.steps[sid].level-- ;
		wdq.generateQueryBuilder() ;
	} ,
	
	onAndOrChange : function ( sid ) {
		wdq.steps[sid].con = $('input[name="and_or'+sid+'"]:checked').val() ;
		wdq.generateQueryPreview() ;
	} ,
	
	onRemoveTreeElement : function ( o ) {
		var self = this ;
		o = $($(o).parent().find('input').get(0)) ;
		var tp = o.attr('treeprop') ;
		var sid = o.attr('sid') ;
		var iid = o.attr('iid') ;
		self.steps[sid].options[tp].splice ( iid , 1 ) ;
		self.generateQueryBuilder() ;
	} ,
	
	onAddTreeElement : function ( o , key , sid ) {
		var l = this.steps[sid].options[key].length ;
		this.steps[sid].options[key].push ( '' ) ;
		this.generateQueryBuilder() ;
		$('input[sid="'+sid+'"][iid="'+l+'"]').focus() ;
	} ,

	generateQueryBuilder : function () {
		var self = this ;
		var h = '' ;
		h += "<div class='qb_step'>" ;
		h += "<div style='float:right'>" ;
		h += self.generateButton ( { callback:'onAddStep' , label:'<i class="icon-plus icon-white"></i>' , id:0 , c:'btn-primary' } ) ;
		h += "</div>" ;
		h += " Show me items that..." ;
		h += "</div>" ;
		h += "<ul class='sortable' style='clear:both;padding-top:2px'>" ;
		$.each ( self.steps , function ( sid , step ) {
			h += "<li id='step" + sid + "' class='ui-state-default step_wrapper'>" ;
			h += self.generateStep ( sid ) ;
			h += "</li>" ;
		} ) ;
		h += "</ul>" ;
		h += "<div id='query_preview'></div>" ;
		$('#querybuilder').html ( h ) ;
		$('#querybuilder form').submit ( function ( e ) {
			e.preventDefault() ;
			return false ;
		} ) ;
		
		if ( 0 ) { // TODO update handler
			$( "#querybuilder .sortable" ).sortable();
			$( "#querybuilder .sortable" ).disableSelection();
		}
		
//		$('#querybuilder button').tooltip() ;
//		$('#querybuilder input').tooltip() ;

		self.addTypeahead() ;
		self.generateQueryPreview() ;
	} ,
	
	getPQlink : function ( pq ) {
		return "<a target='_blank' href='//www.wikidata.org/wiki/"+pq+"' tabindex='-1'>"+pq+"</a>" ;
	} ,
	
	setPQ : function ( input , label , pq ) {
		var self = this ;
		if ( label !== undefined ) $(input).val ( label ) ;
		var helper = $(input).attr ( 'helper' ) ;
		if ( $(input).attr('datatype') == 'nq' ) {
			$('#helper'+helper+' a').attr ( { 'href' : '?q='+$(input).val() } ) ;
		} else {
			$('#helper'+helper).html ( self.getPQlink(pq) ) .show().attr({pq:pq}) ;
		}
	} ,
	
	generateQueryPreview : function () {
		var self = this ;
		var q = [] ;
		var failed = false ;
		var level = 0 ;
		$.each ( self.steps , function ( sid , step ) {
			if ( step.type == 'none' ) return ;
			var s = '' ;
			while ( step.level > level ) { s += "(" ; level++ ; }
			if ( step.type == 'claim' || step.type == 'noclaim' ) {
				var t = '' ;
				$.each ( step.options.claims , function ( cid , c ) {
					if ( c.prop == '' ) { failed = true ; return ; }
					t += (cid==0)?"[":"," ;
					t += c.prop ;
					if ( c.item !== undefined && c.item != '' ) t += ":" + c.item ;
					else if ( c.nq !== undefined && c.nq != '' ) t += ":(" + c.nq + ")" ;
				} ) ;
				if ( t == '' ) return ;
				s += step.type + t + "]" ;
			} else if ( step.type == 'tree' ) {
				var items = step.options.items.join(',') ;
				var forward = step.options.forward.join(',') ;
				var reverse = step.options.reverse.join(',') ;
				if ( items == '' ) { failed = true ; return ; }
				s += 'tree[' + items + '][' + forward + ']' ;
				if ( reverse != '' ) s += '[' + reverse + ']' ;
			}
			var next_level = sid+1 >= self.steps.length ? 0 : self.steps[sid+1].level ;
			while ( next_level < level ) { s += ")" ; level-- ; }
			q.push ( s ) ;
			q.push ( ' '+(step.con||'').toUpperCase()+' ' ) ;
		} ) ;
		q.pop() ; // Last and/or
		self.query = q.join ( '' ) ;
		if ( failed ) {
			$('#query_preview').html ( "<span style='color:red'>Failed to build query</span> - maybe some essential items or properties are empty?" ) ;
		}
		
		function my_encode_uri ( s ) {
			return encodeURIComponent(s.replace(/ /g,'_')).replace(/%3A/g,':').replace(/%2C/g,',') ;
		}
		
		var h = '' ;
		if ( $.trim(self.query) != '' ) {
			h += "Query: <tt style='background-color:#DDDDDD;padding:1px'>" + self.query + "</tt>" ;
			h += " (<a href='?q=" + my_encode_uri(self.query) + "'>Permalink</a>" ;
			h += "/<a title='Raw results for this query' href='" + self.wqapi + "?q=" + self.query + "' target='_blank'>API</a>" ;
			h += "/<a title='View the results in AutoList' href='//tools.wmflabs.org/wikidata-todo/autolist.html?q=" + encodeURIComponent(self.query) + "' target='_blank'>AutoList</a>" ;
			h += "/<a title='Find missing images in WD-FIST' href='//tools.wmflabs.org/fist/wdfist/index.html?wdq=" + escattr(self.query) + "' target='_blank'>WD-FIST</a>" ;
			h += ")" ;
		} else h = "<i>Empty query</i>" ;
		h += " | <a href='#' onclick='wdq.runQuery(true);return false'>Update manually</a>" ;
		$('#query_preview').html ( h ) ;
		self.runQuery () ;
	} ,
	
	runQuery : function ( force_run ) {
		var self = this ;
		if ( !force_run && self.last_query == self.query ) return ;
		if ( force_run ) self.wd.items = {} ;
		self.last_query = self.query ;
		if ( self.main_ajax !== undefined ) self.main_ajax.abort() ; // Abort running query
		$('#main').html("") ;
		if ( self.query == undefined || self.query == '' ) return ;
		$('#main').html("<i>Loading...</i>") ;
		var start = new Date().getTime();
		self.main_ajax = $.getJSON ( self.wqapi+"?callback=?" , {
			q:self.query
		} , function ( d ) {
			var elapsed = new Date().getTime() - start;
			self.main_ajax = undefined ;
			if ( d.status.error != 'OK' ) {
				$('#main').html(d.status.error) ;
				return ;
			}
			if ( d.items === undefined || d.items.length == 0 ) {
				$('#main').html("No items matching the query.") ;
				return ;
			}
			var h = '<h2>Results</h2>' ;
			h += "<div>Query took " + elapsed + "ms. <i>Note that these " + d.items.length + " results are based on a dataset that may be a few days old." ;
			if ( d.items.length > 500 ) h += " Only the first 500 results will be shown; labeling may take a few seconds." ;
			h += "</i></div>" ;
			h += "<ol>" ;
			var items = [] ;
			$.each ( d.items , function ( k ,v ) {
				if ( k >= 500 ) return false ; // Max items to label
				items.push ( v ) ;
			} ) ;
			$.each ( items , function ( dummy , i ) {
				h += "<li><div class='item" + i + "'>" ;
				h += "<a class='itemlink' target='_blank' href='//www.wikidata.org/wiki/Q" + i + "'>Q" + i + "</a> <span class='desc'><i>Loading label...</i></span>" ;
				h += "</div></li>" ;
			} ) ;
			h += "</ol>" ;
			$('#main').html(h) ;
			self.wd.loadItems ( items , { finished:function (p) {
				$.each ( items , function ( dummy , q ) {
					var i = self.wd.getItem('Q'+q) ;
					var l = i.getLabel() ;
					if ( l != '' ) $('#main div.item'+q+' a.itemlink').html ( l ) ;
					var d = i.getDesc() ;
					if ( d != '' ) $('#main div.item'+q+' span.desc').html ( "("+d+")" ) ;
					else $('#main div.item'+q+' span.desc').html ( '' ) ;
				} ) ;
			} } ) ;
		} ) ;
	} ,
	
	addTypeahead : function () {
		var self = this ;
		
		$("input.nqbox").blur ( function () {
			var o = $(this) ;
			self.onClaimChange ( o ) ;
			self.setPQ ( o , undefined , undefined ) ;
		} ) ;
		$("input.nqbox").keyup ( function () {
			var o = $(this) ;
			self.setPQ ( o , undefined , undefined ) ;
		} ) ;
		
		$("input.entrybox").typeahead ( {
			source : function ( query , callback ) {
				var input = $(this.$element[0]) ;
//				console.log ( input.attr('datatype') ) ;
				$.getJSON ( '//www.wikidata.org/w/api.php?callback=?' , {
					action:'wbsearchentities',
					format:'json',
					language:'en',
					type:(input.attr('datatype')=='prop')?'property':'item',
					search:query
				} , function ( d ) {
					var hits = [] ;
					$.each ( (d.search||[]) , function ( dummy , v ) {
						var t = "<b>" + v.label + "</b>" ;
						t += " (<i>" + v.id + "</i>)" ;
						if ( v.description !== undefined ) t += "<br/>" + v.description ;
						hits.push ( t ) ;
					} ) ;
					callback ( hits ) ;
				} ) ;
			} ,
			updater : function ( item ) {
				var label = item.match(/<b>(.+?)<\/b>/) [1] ;
				var pq = item.match(/<i>(.+?)<\/i>/) [1] ;
				var input = $(this.$element[0]) ;
				self.setPQ ( input , undefined , pq ) ;
				self.onClaimChange ( input ) ;
				return label ;
			} ,
			matcher : function () { return true } , // FIXME
			minLength : 1 ,
			items:20
		} ) ;
	} ,
	
	
	
	onClaimChange : function ( o ) {
		var self = this ;
		o = $(o) ;
		var sid = o.attr('sid') ;
		var cid = o.attr('cid') ;
		var dt = o.attr('datatype') ;
		var v ;
		
		if ( dt == 'nq' ) {
			v = o.val() ;
		} else {
			var helper = o.attr('helper') ;
			var h = $('#helper'+helper) ;
			v = h.attr('pq').replace(/\D/g,'') ;
			self.wd.loadItems ( [ h.attr('pq') ] ) ;
		}

		if ( self.steps[sid].type == 'tree' ) {
			var tp = o.attr('treeprop') ;
			var iid = o.attr('iid') ;
			self.steps[sid].options[tp][iid] = v ;
		} else {
			self.steps[sid].options.claims[cid][dt] = v ;
		}
		self.generateQueryPreview() ;
	} ,
	
	onRemoveClaim : function ( o , sid , cid ) {
		this.steps[sid].options.claims.splice ( cid , 1 ) ;
		var h = this.generateStep ( sid ) ;
		$('#step'+sid).html ( h ) ;
		this.addTypeahead() ;
		this.generateQueryPreview() ;
	} ,

	onAddNQ : function ( o , sid ) {
		var self = wdq ;
		self.steps[sid].options.claims.push ( { prop:'' , nq : '' } ) ;
		var h = self.generateStep ( sid ) ;
		$('#step'+sid).html ( h ) ;
		self.addTypeahead() ;
//		self.updateAllHelpers() ;
		self.generateQueryPreview() ;
	} ,
	
	onAddClaim : function ( o , sid ) {
		var self = wdq ;
		self.steps[sid].options.claims.push ( { item:'' , prop:'' } ) ;
		var h = self.generateStep ( sid ) ;
		$('#step'+sid).html ( h ) ;
		self.addTypeahead() ;
//		self.updateAllHelpers() ;
		self.generateQueryPreview() ;
	} ,
	
	onStepOptionChange : function ( o , sid ) {
		var self = this ;
		o = $(o) ;
		var val = o.val() ;
		self.steps[sid] = self.getBlankStep ( val ) ;
		self.generateQueryBuilder() ;
	} ,
	
	onAddStep : function ( after ) {
		var self = this ;
		var step = self.getBlankStep() ;
		self.steps.splice ( after , 0 , step ) ;
		self.generateQueryBuilder() ;
		return false ;
	} ,
	
	onRemoveStep : function ( sid ) {
		var self = this ;
		self.steps.splice ( sid , 1 ) ;
		self.generateQueryBuilder() ;
		return false ;
	} ,
	
	getBlankStep : function ( type ) {
		if ( undefined === type ) type = 'claim' ;
		var o = {} ;
		if ( type == 'claim' || type == 'noclaim' ) {
			o = { claims:[] } ;
		} else if ( type == 'tree' ) {
			o = { items:[] , forward:[] , reverse:[] } ;
		}
		return { type:type , options:o , con:'and' , level:0 } ;
	} ,

	init : function () {
		this.wd = new WikiData ;
		$('#main_content').show() ;
		
		this.generateQueryBuilder() ;
	} ,
	
	initializeFromParameters : function () {
		var self = this ;
		self.params = getUrlVars() ;
		if ( undefined !== self.params.q ) {
		
			// Lexing
			var q = self.params.q.replace(/_/g,' ').replace(/(\[\]\(\))/g,' \1 ').split(/\b/) ;
			var q2 = [] ;
			$.each ( q , function ( k , v ) {
				v = $.trim ( v.toUpperCase() ) ;
				if ( v == '' ) return ;
				if ( -1 != $.inArray ( v , ['CLAIM','AND','OR','NOCLAIM','TREE'] ) ) { q2.push ( v ) ; return ; }
				if ( null != v.match ( /^\d+$/ ) ) { q2.push ( v ) ; return ; }
				if ( v.length == 1 ) { q2.push ( v ) ; return ; }
				for ( var i = 0 ; i < v.length ; i++ ) q2.push ( v.substr(i,1) ) ;
			} ) ;
//			console.log ( q2 ) ;
			
			// Parsing
			self.steps = [] ;
			var step = self.getBlankStep() ;
			step.type == '' ;
			var level = 0 ;
			var inParams = false ;
			var nextParamType = '' ;
			$.each ( q2 , function ( k , v ) {
				if ( v == '' ) return ;
				if ( !inParams ) {
					if ( v == '(' ) { level++ ; step.level++ ; return ; }
					if ( v == ')' ) { level-- ; return ; }
				}
				if ( v == '[' ) { inParams = true ; return ; }
				if ( v == ']' ) {
					inParams = false ;
					if ( nextParamType == 'I' ) nextParamType = 'F' ;
					else if ( nextParamType == 'F' ) nextParamType = 'R' ;
					return ;
				}
				if ( v == 'CLAIM' || v == 'NOCLAIM' ) {
					step.type = v.toLowerCase() ;
					options = step.options.claims ;
					nextParamType = '' ;
					return ;
				}
				if ( inParams ) {
					if ( v == ',' ) return ;
					if ( v == ':' ) { nextParamType = 'item' ; return ; }
					else if ( v == '(' ) {
						nextParamType = 'nq' ;
						var nq = '' ;
						var nq_count = 0 ;
						for ( var k2 = k ; k2 < q2.length ; k2++ ) {
							var v2 = q2[k2] ;
							q2[k2] = '' ;
							if ( v2 == '(' ) {
								if ( nq_count > 0 ) nq += v2 ;
								nq_count++ ;
							} else if ( v2 == ')' ) {
								nq_count-- ;
								if ( nq_count == 0 ) {
									step.options.claims[step.options.claims.length-1].nq = nq ;
									return ;
								}
								nq += v2 ;
							} else if ( v2 == 'AND' || v2 == 'OR' ) {
								nq += ' ' + v2 + ' ' ;
							} else {
								nq += v2 ;
							}
						}
						return ;
					}
					if ( null != v.match ( /^\d+$/ ) ) {
						v = 1 * v ;
						if ( nextParamType == 'item' ) {
							step.options.claims[step.options.claims.length-1].item = v ;
							nextParamType = '' ;
						} else if ( nextParamType == '' ) {
							step.options.claims.push ( {} ) ; //  prop:v , item:'' 
							step.options.claims[step.options.claims.length-1].prop = v ;
//							step.options.claims[step.options.claims.length-1].item = '' ;
						} else if ( nextParamType == 'I' ) {
							step.options.items.push ( v ) ;
						} else if ( nextParamType == 'F' ) {
							step.options.forward.push ( v ) ;
						} else if ( nextParamType == 'R' ) {
							step.options.reverse.push ( v ) ;
						}
					}
				}
				if ( v == 'TREE' ) {
					step.type = v.toLowerCase() ;
					step.options = { items:[] , forward:[] , reverse:[] } ;
					nextParamType = 'I' ;
					return ;
				}
				if ( v == 'AND' || v == 'OR' ) {
					self.steps.push ( step ) ;
					step = self.getBlankStep() ;
					step.con = v.toLowerCase() ;
					step.level = level ;
					step.type == '' ;
					nextParamType = '' ;
					return ;
				}
				
			} ) ;
			if ( step.type != '' ) self.steps.push ( step ) ;

			self.initializeFromSetup () ;
			
		} else {
			self.steps.push ( { type:'claim' , options:{claims:[]} } ) ;
			self.initializeFromSetup () ;
		}
	} ,

	initializeFromSetup : function () {
		var self = this ;
		var todo = [] ;
		$.each ( self.steps , function ( sid , step ) {
			if ( step.options === undefined ) return ;
			$.each ( ['claims','items','forward','reverse'] , function ( dummy , section ) {
				$.each ( (step.options[section]||[]) , function ( dummy2 , v ) {
					if ( (typeof v) == 'number' || (typeof v) == 'string' ) {
						var i = section=='items'?'Q'+v:'P'+v ;
						if ( v !== undefined && undefined === self.wd.items[i] ) todo.push ( i ) ;
					} else {
						if ( v.prop !== undefined && undefined === self.wd.items['P'+v.prop] ) todo.push ( 'P'+v.prop ) ;
						if ( v.item !== undefined && undefined === self.wd.items['Q'+v.item] ) todo.push ( 'Q'+v.item ) ;
					}
				} ) ;
			} ) ;
		} ) ;
		self.wd.loadItems ( todo , { finished:function (p) {
			wdq.generateQueryBuilder() ;
		} } ) ;
	} ,

	fin : false
} ;

$(document).ready ( function () {
	$('#main_content').hide() ;
	loadMenuBarAndContent ( { toolname : 'WikiDataQuery' , meta : 'WikiDataQuery' , content : 'form.html' , run : function () {
		wdq.init() ;
		wdq.initializeFromParameters() ;

//		wdq.steps.push ( { type:'claim' , options:{claims:[{prop:31,item:12280}]} } ) ;
//		wdq.steps.push ( { type:'claim' , options:{claims:[{prop:177,item:1653}]} } ) ;
/*
		wdq.steps.push ( { type:'claim' , options:{claims:[{prop:31,item:12280}]} , con:'and' , level:0 } ) ;
		wdq.steps.push ( { type:'tree' , options:{items:[183],forward:[150],reverse:[17,131]} , con:'and' , level:0 } ) ;
		wdq.steps.push ( { type:'claim' , options:{claims:[{prop:131,item:4190}]} , con:'and' , level:0 } ) ;
		wdq.initializeFromSetup () ;*/
	} } ) ;
} ) ;
