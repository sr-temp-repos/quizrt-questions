function WDQ ( node) {
	
	var self = this ;
	
	this.lang = 'en' ;
	this.node = node ;
	this.api = 'http://wdq.wmflabs.org/api' ;
	this.api_add = '?callback=?' ;
	this.wdcache = {} ;
	this.special_space = '&zwj;' ;
	this.icons = {
		add_qualifier : 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/Gtk-zoom-in.svg/20px-Gtk-zoom-in.svg.png' ,
		add : 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Nuvola_action_edit_add-2.svg/20px-Nuvola_action_edit_add-2.svg.png' ,
		remove : 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Gtk-stop.svg/20px-Gtk-stop.svg.png' ,
		close : 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/VisualEditor_-_Icon_-_Close.svg/20px-VisualEditor_-_Icon_-_Close.svg.png'
	} ;
	
	this.onQueryUpdate = function () {} ; // Dummy
	
	this.key_labels = {
		link_params:'Sites',
		nolink_params:'Sites',
		claim_params:'Prop/:Item/:Query' ,
		noclaim_params:'Prop/:Item/:Query' ,
		string_params:'Prop:String' ,
		web_items:'Root items',
		web_props:'Properties',
		tree_items:'Root items',
		tree_props:'Forward',
		tree_rprops:'Reverse'
	} ;
	
	this.commands = [
		'CLAIM' ,
		'STRING' ,
		'TREE' ,
		'WEB' ,
		'BETWEEN' ,
		'AROUND' ,
		'QUANTITY' ,
		'LINK' ,
		'NOLINK'
	] ;
	
	this.can_have_qualifiers = {
		CLAIM:true,
		STRING:true,
		AROUND:true,
		BETWEEN:true,
		QUANTITY:true
	} ;
	
	
	this.lexer = function ( text ) {
		var ret = [] ;
		var s = '' ;
		var quote ;
		var in_quote = false ;
		var escaped = false ;
		var level = 0 ;
		$.each ( text.split('') , function ( dummy , c ) {
			if ( escaped ) { // Backslash
				s += c ;
				escaped = false ;
				return ;
			}
			if ( in_quote ) { // Continue/end quoted string
				if ( c == quote ) {
					ret.push ( { s:s , quoted:true , level:level } ) ;
					s = '' ;
					in_quote = false ;
				} else if ( c == '\\' ) {
					escaped = true ;
				} else s += c ;
				return ;
			}
			if ( c == '"' || c == "'" ) { // Start quoted string
				if ( s != '' ) ret.push ( { s:s , level:level } ) ;
				s = '' ;
				quote = c ;
				in_quote = true ;
				return ;
			}
			if ( -1 != $.inArray ( c , [ '[' , ']' , '{' , '}' , '(' , ')' ] ) ) {
				if ( s != '' ) ret.push ( { s:s , level:level } ) ;
				s = '' ;
				var open = -1 != $.inArray(c,['(','[','{']) ;
				if ( open ) level++ ;
				ret.push ( { s:c , bracket:true , open:open , level:level } ) ;
				if ( !open ) level-- ;
				return ;
			}
			if ( -1 != $.inArray ( c , [',',':'] ) ) {
				if ( s != '' ) ret.push ( { s:s , level:level } ) ;
				s = '' ;
				ret.push ( { s:c , special:true , level:level } ) ;
				return ;
			}
			if ( c == ' ' ) {
				if ( s != '' ) ret.push ( { s:s , level:level } ) ;
				s = '' ;
				return ;
			}
			s += c.toUpperCase() ;
		} ) ;
		if ( s != '' ) ret.push ( { s:s , level:level } ) ;
		return ret ;
	}
	
	this.parse = function ( text , no_query_reconstruction ) {
		
		function scan ( list ) {
			var ret = [] ;
			while ( list.length > 0 ) {
				var k = list.shift() ;
				if ( k.bracket && k.open ) {
					k.sub = [] ;
					while ( list.length > 0 ) {
						var k2 = list.shift() ;
						if ( k2.bracket && !k2.open && k2.level == k.level ) {
							k.s += k2.s ;
							break ;
						}
						k.sub.push ( k2 ) ;
					}
					k.sub = scan ( k.sub ) ;
				}
				ret.push ( k ) ;
			}
			return ret ;
		}
		
		function parseClaimParameters ( list ) {
			var ret = [] ;
			while ( list.length > 0 ) {
				var first = list.shift() ;
				if ( first.s == ',' ) continue ;
				var o = { prop:first.s , type:'prop' } ;
				if ( (list[0]||{}).s == ':' ) {
					list.shift() ;
					if ( list.length == 0 ) {} // TODO error handling
					var k2 = (list.shift()||{}) ;
					if ( k2.s == '()' ) {
						o.type = 'prop_sub' ;
						o.sub = finalParse ( k2.sub ) ;
					} else {
						o.type = 'prop_item' ;
						o.item = k2.s ;
					}
				}
				ret.push ( o ) ;
			}
			return ret ;
		}
		
		function parseStringParameters ( list ) {
			var ret = [] ;
			while ( list.length > 0 ) {
				var o = { prop:list.shift().s , type:'string' } ;
				if ( list.length == 0 ) {} // TODO error handling
				if ( list[0].s != ':' ) {} // TODO error handling
				list.shift() ;
				if ( list.length == 0 ) {} // TODO error handling
				if ( !list[0].quoted ) {} // TODO error handling
				o.s = list.shift().s ;
				ret.push ( o ) ;
				if ( list.length > 0 ) list.shift() ; // ","
			}
			return ret ;
		}
		
		function removeCommas ( list , type ) {
			var ret = [] ;
			var last_was_comma = false ;
			$.each ( list , function ( k , v ) {
				if ( v.s==',' && last_was_comma ) {
					var o = { type:type } ;
					o[type] = '' ;
					ret.push ( o ) ;
					last_was_comma = false ;
				} else if ( v.s != ',' ) {
					var o = { type:type } ;
					o[type] = v.s ;
					ret.push ( o ) ;
					last_was_comma = false ;
				} else {
					last_was_comma = true ;
				}
			} ) ;
			return ret ;
		}
		
		function parseQuantity ( list ) {
			var ret = [] ;
			ret.push ( { type:'prop' , prop:list[0].s } ) ;
			ret.push ( { type:'float' , float:list[2].s } ) ;
			if ( list.length == 5 ) ret.push ( { type:'float' , float:list[4].s } ) ;
			else ret.push ( { type:'float' , float:'' } ) ;
			return ret ;
		}
		
		function finalParse ( list ) {
			var ret = [] ;
			ret.errors = 0 ;
			while ( list.length > 0 ) {
				var k = list.shift() ;
				
				if ( k.s == 'AND' || k.s == 'OR' ) {
					ret.push ( k ) ;
					continue ;
				}
				
				if ( k.s == '()' ) {
					k.sub = finalParse ( k.sub ) ;
					ret.push ( k ) ;
					continue ;
				}
				
				if ( k.s == 'CLAIM' || k.s == 'NOCLAIM' ) {
					if ( list.length > 0 && list[0].s == '[]' ) {
						k.params = parseClaimParameters ( list.shift().sub ) ;
					} else {
						ret.errors +=1 ;
					}
				} else if ( k.s == 'TREE' ) {
					if ( list.length > 0 && list[0].s == '[]' ) {
						k.items = removeCommas ( list.shift().sub , 'item' ) ;
					} else {
						// TODO error handling
					}
					if ( list.length > 0 && list[0].s == '[]' ) {
						k.props = removeCommas ( list.shift().sub , 'prop' ) ;
					} else {
						// TODO error handling
					}
					if ( list.length > 0 && list[0].s == '[]' ) {
						k.rprops = removeCommas ( list.shift().sub , 'prop' ) ;
					} else k.rprops = [] ;
				} else if ( k.s == 'WEB' ) {
					if ( list.length > 0 && list[0].s == '[]' ) {
						k.items = removeCommas ( list.shift().sub , 'item' ) ;
					} else {
						// TODO error handling
					}
					if ( list.length > 0 && list[0].s == '[]' ) {
						k.props = removeCommas ( list.shift().sub , 'prop' ) ;
					} else k.props = [] ;
				} else if ( k.s == 'STRING' ) {
					if ( list.length > 0 && list[0].s == '[]' ) {
						k.params = parseStringParameters ( list.shift().sub ) ;
					} else {
						// TODO error handling
					}
				} else if ( k.s == 'AROUND' ) {
					if ( list.length > 0 && list[0].s == '[]' ) {
						k.params = removeCommas ( list.shift().sub , 'float' ) ;
					} else {
						// TODO error handling
					}
					if ( k.params.length != 4 ) {} // TODO error handling
					k.params[0].type = 'prop' ;
					k.params[0].prop = k.params[0].float ;
					k.params[1].hint = 'Latitude' ;
					k.params[2].hint = 'Longitude' ;
					k.params[3].hint = 'Radius [km]' ;
				} else if ( k.s == 'BETWEEN' ) {
					if ( list.length > 0 && list[0].s == '[]' ) {
						k.params = removeCommas ( list.shift().sub , 'date' ) ;
					} else {
						// TODO error handling
					}
					if ( k.params.length != 3 ) {} // TODO error handling
					k.params[0].type = 'prop' ;
					k.params[0].prop = k.params[0].date ;
				} else if ( k.s == 'QUANTITY' ) {
					if ( list.length > 0 && list[0].s == '[]' ) {
						k.params = parseQuantity ( list.shift().sub ) ;
					} else {
						// TODO error handling
					}
					k.params[1].hint = 'Value (or lower boundary)' ;
					k.params[2].hint = 'Upper boundary (optional)' ;
				} else if ( k.s == 'LINK' || k.s == 'NOLINK' ) {
					if ( list.length > 0 && list[0].s == '[]' ) {
						k.params = removeCommas ( list.shift().sub , 'site' ) ;
					} else {
						// TODO error handling
					}
				} else {
					// TODO error handling
				}

				if ( list.length > 0 && list[0].s == '{}' ) {
					var kq = list.shift() ;
					k.qualifier = finalParse ( kq.sub ) ;
				}
				ret.push ( k ) ;
			}
			return ret ;
		}
		
//		console.log ( text ) ;
		var l = self.lexer ( text ) ;
		l = scan ( l ) ;
		self.structure = finalParse ( l ) ;
		self.render ( no_query_reconstruction ) ;
		self.onQueryUpdate ( self.node.find('input.wdq_editor_query').val() ) ;
	}
	
	this.render = function ( no_query_reconstruction ) {
//		console.log( self.structure );
		if (self.structure.errors > 0) {
			$('#wdq div input').css('background-color', '#FFEBD9');
			return ;
		} else {
			$('#wdq div input').css('background-color', '');
		}

		var q = self.generateQuery ( self.structure ) ;
		if ( q == self.last_query_rendered ) return ;
		self.last_query_rendered = q ;
		
		self.inputboxes = [] ;

		function reRender () { // Construct query based on layout, then re-render
			$('#wdq_editor_command_float').remove() ;
			var q = self.generateQuery ( self.structure ) ;
			var query = self.node.find('input.wdq_editor_query') ;
			query.val ( q ) ;
			self.parse ( q ) ;
		}
		
		
		function getInputBox ( o , key ) {
			var num = self.inputboxes.length ;
			var value = o[key] ;
			if ( key == 'string' ) value = JSON.parse ( '"'+o.s+'"' ) ;
			var box = { o:o , key:key } ;
			var hint = typeof o.hint == 'undefined' ? key : o.hint ;
			if ( hint == 'prop' ) hint = 'Property' ;
			if ( hint == 'item' ) hint = 'Item' ;
			var h = '' ;
			h += "<div class='wdq_editor_span wdq_editor_span_"+key ;
			h += "' num='"+num+"' title='"+hint+"; click to edit'" ;
			if ( key == 'prop' ) h += " q='P"+value+"'" ;
			if ( key == 'item' ) h += " q='Q"+value+"'" ;
			h += ">" + (value==''?self.special_space:self.htmlEncode(value)) + "</div>" ;
			self.inputboxes.push ( box ) ;
			return h ;
		}
		
		this.htmlEncode = function (value){
			if (value) {
				return jQuery('<div />').text(value).html();
			} else {
				return '';
			}
		}
 
		this.htmlDecode = function (value) {
			if (value) {
				return $('<div />').html(value).text();
			} else {
				return '';
			}
		}
		
		function getHTML ( list ) {
			var h = '' ;
			
			h += "<div class='wdq_editor_block '>" ;
			$.each ( list , function ( oid , o ) {
				if ( o.s == '()' ) {
					h += "<div class='wdq_editor_round_brackets'>" ;
					h += getHTML ( o.sub||[] ) ;
					h += "</div>" ;
					return ;
				}
				
				var command = o.s ;
				h += "<div class='wdq_editor_block wdq_editor_command'>" ;
				if ( command == 'AND' || command == 'OR' ) {
					h += "<b>" + command + "</b>" ;
				} else {
					var num = self.inputboxes.length ;
					h += "<div class='wdq_editor_command_header' num='"+num+"'>" ;
					h += "<select class='wdq_editor_command_header' num='"+num+"'>" ;
					$.each ( self.commands , function ( k , v ) {
						h += "<option value='" + v + "'" + (v==command?"selected":"") + ">" + v + "</option>" ;
					} ) ;
					h += "</select>" ;
					h += "</div>" ;
					self.inputboxes.push ( { o:o , parent:list , oid:oid } ) ;
					$.each ( ['params','items','props','rprops'] , function ( dummy2 , key ) {
						if ( typeof o[key] == 'undefined' ) return ;
						h += "<div class='wdq_editor_command_section'>" ;
						var label_key = command.toLowerCase()+'_'+key ;
						if ( typeof self.key_labels[label_key] != 'undefined' ) {
							h += "<div class='wdq_editor_command_section_header' num='"+num+"' prop='"+key+"' command='"+command+"'>" ;
							h += self.key_labels[label_key] ;
							h += "</div>" ;
						}
						$.each ( o[key] , function ( k1 , v1 ) {
							h += "<div class='wdq_editor_command_section_part' command='"+command+"'>" ;
							if ( v1.type == 'item' ) {
								h += getInputBox ( v1 , 'item' ) ;
							} else if ( v1.type == 'prop' ) {
								h += getInputBox ( v1 , 'prop' ) ;
							} else if ( v1.type == 'prop_item' ) {
								h += getInputBox ( v1 , 'prop' ) ;
								h += " : " ;
								h += getInputBox ( v1 , 'item' ) ;
							} else if ( v1.type == 'prop_sub' ) {
								h += getInputBox ( v1 , 'prop' ) ;
								h += " : <div class='wdq_editor_block'>" ;
								h += getHTML ( v1.sub ) ;
								h += "</div>" ;
							} else if ( v1.type == 'string' ) {
								h += getInputBox ( v1 , 'prop' ) ;
								h += " : " ;
								h += getInputBox ( v1 , 'string' ) ;
							} else if ( v1.type == 'date' ) {
								h += getInputBox ( v1 , 'date' ) ;
							} else if ( v1.type == 'float' ) {
								h += getInputBox ( v1 , 'float' ) ;
							} else if ( v1.type == 'site' ) {
								h += getInputBox ( v1 , 'site' ) ;
							}
							h += "</div>" ;
						} ) ;
						if ( typeof o.qualifier != 'undefined' ) {
							var qnum = self.inputboxes.length ;
							self.inputboxes.push ( { o:o.qualifier , parent:o , type:'qualifier' } ) ;
							h += "<div class='wdq_editor_qualifier'>" ;
							h += "<div class='wdq_editor_qualifier_header' num='"+qnum+"'>" ;
							h += "Qualifier" ;
							h += "</div>" ;
							h += "<div class='wdq_editor_qualifier_body'>" ;
							if ( o.qualifier.length == 0 ) {
								h += "<div class='wdq_editor_a_add_qualifier_parts'>" ;
//								h += "<img src='' title='Add ' />" ;
								h += "</div>" ;
							} else {
								h += getHTML ( o.qualifier ) ;
							}
							h += "</div>" ;
							h += "</div>" ;
						}
						h += "</div>" ;
					} ) ;
				}
				h += "</div>" ;
			} ) ;
			h += "</div>" ;
			return h ;
		}
		
		function highlightProblematic () {
			self.node.find('div.wdq_editor_problem').removeClass ( 'wdq_editor_problem' ) ;
			self.node.find('div.wdq_editor_span[q="Q0"]').addClass ( 'wdq_editor_problem' ) ;
			self.node.find('div.wdq_editor_span[q="P0"]').addClass ( 'wdq_editor_problem' ) ;
			self.node.find('div.wqd_no_label').addClass ( 'wdq_editor_problem' ) ;
		}
		
		var h = getHTML ( self.structure ) ;
		self.node.find('div.wdq_editor_main_block').html ( h ) ;
		
		var query = self.node.find('input.wdq_editor_query') ;
		if ( no_query_reconstruction ) {
		} else {
			query.val ( q ) ;
		}
		
		// Add qualifier remove hover button
		self.node.find('div.wdq_editor_qualifier_header').each ( function () {
			var o = $(this) ;
			h = "<div class='wdq_editor_command_section_part_float' title='Remove this qualifier query'><img src='"+self.icons.remove+"' /></div>" ;
			o.prepend ( h ) ;
			var c = o.children('.wdq_editor_command_section_part_float') ;
			c.click ( function () {
				var num = o.attr('num') ;
				var ib = self.inputboxes[num] ;
				delete ib.parent.qualifier ;
				reRender() ;
				return false ;
			} ) ;
			o.mouseenter ( function () { c.show() } ) ;
			o.mouseleave ( function () { c.hide() } ) ;
		} ) ;
		
		// Add part remove hover button
		$.each ( ['TREE','CLAIM','NOCLAIM','STRING','LINK','NOLINK','WEB'] , function ( dummy , command ) {
			self.node.find('div.wdq_editor_command_section_part[command="'+command+'"]').each ( function () {
				var o = $(this) ;
				var target = $(o.find('.wdq_editor_span').get(0)) ;
				var add_to = (command=='STRING') ? target : o ;
				add_to = o ; // Hack; this could display more elegantly
				h = "<div class='wdq_editor_command_section_part_float' title='Remove this "+target.attr('title').toLowerCase()+"'><img src='"+self.icons.remove+"' /></div>" ;
				add_to.prepend ( h ) ;
				var c = add_to.children('.wdq_editor_command_section_part_float') ;
				c.click ( function () {
					var num = target.attr('num') ;
					var ib = self.inputboxes[num] ;
					ib.o.remove_me = true ;
					reRender() ;
					return false ;
				} ) ;
				add_to.mouseenter ( function () { c.show() } ) ;
				add_to.mouseleave ( function () { c.hide() } ) ;
			} ) ;
		} ) ;
		
		var all_pq = {} ;
		var to_load = [] ;
		var loading = {} ;
		self.node.find('div.wdq_editor_span').each ( function () {
			var o = $(this) ;
			var ip = o.attr('q') ;
			all_pq[ip] = true ;
			if ( typeof ip == 'undefined' ) return ;
			if ( typeof self.wdcache[ip] != 'undefined' ) return ;
			if ( typeof loading[ip] != 'undefined' ) return ;
			loading[ip] = true ; // Loading marker
			to_load.push ( ip ) ;
		} ) ;
		self.node.find('div.wdq_editor_span').click ( self.showDropdown ) ;

		$('#wdq_editor_dropdown_select').dblclick ( function () {
			storeEdit() ;
		} ) ;

		// Hover commands
		h = '' ;
		h += "<div class=''>" ;
		h += "<img src='"+self.icons.add+"' title='Add command' class='wdq_editor_a_add' />" ;
		h += "<img src='"+self.icons.remove+"' title='Remove command' class='wdq_editor_a_remove' /> " ;
		h += "<span class='wdq_editor_a_qualifier'></span>" ;
		h += "</div>" ;

		self.node.find('select.wdq_editor_command_header').change ( function () {
			var o = $(this) ;
			var num = o.attr('num') ;
//			console.log ( self.inputboxes[num].o ) ; return ;
			var nv = o.val() ;
			var no = { s:nv , level:self.inputboxes[num].o.level } ;
			if ( nv == 'CLAIM' || nv == 'NOCLAIM' ) {
			} else if ( nv == 'TREE' ) {//
				no.items = [] ;
				no.props = [] ;
				no.rprops = [] ;
			} else if ( nv == 'WEB' ) {//
				no.items = [] ;
				no.props = [] ;
			} else if ( nv == 'STRING' ) {
				no.params = [ {prop:'0',s:'' } ] ;
			} else if ( nv == 'AROUND' ) {
				no.params = [ {prop:'625'} , {'float':'0'} , {'float':'0'} , {'float':'0'} ] ;
			} else if ( nv == 'BETWEEN' ) {
				no.params = [ {prop:'0'} , {date:'0'} , {date:'0'} ] ;
			} else if ( nv == 'QUANTITY' ) {
				no.params = [ {prop:'0'} , {'float':'0'} , {'float':'0'} ] ;
			} else if ( nv == 'LINK' || nv == 'NOLINK' ) {
				no.params = [] ;
			}

			$.extend ( self.inputboxes[num].o , no ) ;
			$('#wdq_editor_command_float').remove() ;
			reRender() ;
		} ) ;

		self.addHover ( 'div.wdq_editor_command_header' , h , function ( orig ) {
			var ib = self.inputboxes[orig.attr('num')] ;
			var base = $('#wdq_editor_command_float') ;
			
			// Qualifiers
			if ( self.can_have_qualifiers[ib.o.s] ) {
				var has_qual = typeof ib.o.qualifier != 'undefined' ;
				if ( has_qual ) {
					base.find('.wdq_editor_a_qualifier').remove() ;
				} else {
					base.find('.wdq_editor_a_qualifier').html ( "<img src='"+self.icons.add_qualifier+"' title='Add qualifier query'/>" ) ;
					base.find('.wdq_editor_a_qualifier').click ( function () {
						ib.o.qualifier = [ {s:'CLAIM',params:[]} ] ;
//						console.log ( self.structure ) ;
						reRender() ;
					} ) ;
				}
			} else {
				base.find('.wdq_editor_a_qualifier').remove() ;
			}
			
			// Add command
			base.find('.wdq_editor_a_add').click ( function () {
				var n_and = { s:'AND' , level:ib.level } ;
				var n_o = { s:'CLAIM' , level:ib.level , params:[] } ;
				ib.parent.splice ( ib.oid+1 , 0 , n_o ) ;
				ib.parent.splice ( ib.oid+1 , 0 , n_and ) ;
				
				reRender() ;
				return false ;
			} ) ;
			
			// Remove command
			base.find('.wdq_editor_a_remove').click ( function () {
				var m = ib.oid == 0 ? 0 : 1 ;
				ib.parent.splice ( ib.oid-m , 2 ) ;
				reRender() ;
				return false ;
			} ) ;
		} ) ;
		
		// Section hovers
		self.node.find('div.wdq_editor_command_section_header').each ( function () {
			var o = $(this) ;
			var num = o.attr('num') ;
			var prop = o.attr('prop') ;
			var command = o.attr('command') ;
			var ib = self.inputboxes[num] ;

			h = "<div class='wdq_editor_command_section_part_float'>" ;
			if ( command == 'CLAIM' || command == 'NOCLAIM' ) {
				h += "<img title='Add property' src='"+self.icons.add+"' class='wdq_editor_part_add_claim_prop' /> " ;
				h += "<img title='Add property:item' src='"+self.icons.add+"' class='wdq_editor_part_add_claim_prop_item' /> " ;
				h += "<img title='Add property:query' src='"+self.icons.add+"' class='wdq_editor_part_add_claim_prop_sub' />" ;
			} else {
				h += "<img title='Add entry' src='"+self.icons.add+"' class='wdq_editor_part_add' />" ;
			}
			h += "</div>" ;
			o.prepend ( h ) ;
			var c = o.children('.wdq_editor_command_section_part_float') ;
			c.find('.wdq_editor_part_add').click ( function () {
				if ( prop == 'params' ) {
					if ( command == 'LINK' || command == 'NOLINK' ) ib.o[prop].push ( { site:'0' } ) ;
					if ( command == 'STRING' ) ib.o[prop].push ( { prop:0,s:'' } ) ;
				} else if ( prop == 'items' ) {
					ib.o[prop].push ( { item:0 } ) ;
				} else if ( prop == 'props' || prop == 'rprops' ) {
					ib.o[prop].push ( { prop:0 } ) ;
				}
				reRender() ;
				return false ;
			} ) ;
			c.find('.wdq_editor_part_add_claim_prop').click ( function () { ib.o.params.push ( { prop:0 , type:'prop' } ) ; reRender() ; } ) ;
			c.find('.wdq_editor_part_add_claim_prop_item').click ( function () { ib.o.params.push ( { prop:0 , item:0 , type:'prop_item' } ) ; reRender() ; } ) ;
			c.find('.wdq_editor_part_add_claim_prop_sub').click ( function () { ib.o.params.push ( { prop:0 , sub:[{s:'CLAIM',params:[]}] , type:'prop_sub' } ) ; reRender() ; } ) ;
			o.mouseenter ( function () { c.show() } ) ;
			o.mouseleave ( function () { c.hide() } ) ;
		} ) ;

		// Update property labels
		self.loadWD ( to_load , function () {
			$.each ( all_pq , function ( k , dummy ) {
				var x = self.node.find('div.wdq_editor_span[q="'+k+'"]') ;
				x.html ( self.getLabel(k) ) ;
				if ( !self.hasLabel ( k ) ) x.addClass('wqd_no_label') ; //.attr({title:'No label, or property does not exist'}) ;
			} ) ;
			highlightProblematic() ;
		} ) ;
		highlightProblematic() ;
	}
	
	this.addHover = function ( selector , h_inner , callback_after_show ) {
		var timeout ;
		var sel = self.node.find(selector) ;
		$.each ( sel , function ( dummy0 , cur ) {
			cur = $(cur) ;
			cur.mouseenter ( function () {
				$('#wdq_editor_command_float').remove() ;
				var o = $(this) ;
				o.addClass ( 'wdq_hover_root_highlight' ) ;
				var h = '' ;
				h += "<div id='wdq_editor_command_float'>" ;
				h += h_inner ;
				h += "</div>" ;
				cur.prepend ( h ) ;
				var fl = $('#wdq_editor_command_float') ;
			
				$('#wdq_editor_command_float').mouseenter ( function () {
					o.addClass ( 'wdq_hover_root_highlight' ) ;
					if ( typeof timeout != 'undefined' ) clearTimeout ( timeout ) ;
					timeout = undefined ;
				} ) ;
				$('#wdq_editor_command_float').mouseleave ( function () {
					o.removeClass ( 'wdq_hover_root_highlight' ) ;
					$('#wdq_editor_command_float').remove() ;
				} ) ;
				if ( typeof callback_after_show != 'undefined' ) callback_after_show ( o ) ;
			} ) ;

			cur.mouseleave ( function () {
				var o = $(this) ;
				timeout = setTimeout ( function () {
					o.removeClass ( 'wdq_hover_root_highlight' ) ;
					$('#wdq_editor_command_float').remove() ;
				} , 10 ) ;
			} ) ;
		} ) ;
	}
	
	this.showDropdown = function () {
		var o = $(this) ;
		var ib = self.inputboxes[o.attr('num')] ;
//		console.log ( ib ) ;
		
		$('#wdq_editor_dropdown').remove() ;
		var h = "<div id='wdq_editor_dropdown'>" ;
		h += "<div title='Close this dialog' id='wdq_editor_dropdown_close'><img src='"+self.icons.close+"'/></div>" ;
		h += "<div class='wdq_editor_dropdown_title'>" + o.attr('title') + "</div>" ;
		h += "<form id='wdq_editor_dropdown_form'>" ;
		h += "<div><input type='text' width='100%' autocomplete='off' id='wdq_editor_dropdown_input' /> " ;
		h += "<input type='submit' value='OK' /><span id='wdq_editor_dropdown_searching'><i>Searching...</i></span></div>" ;
		if ( ib.key == 'prop' || ib.key == 'item' ) {
			h += "<div><select id='wdq_editor_dropdown_select' size=10></select></div>" ;
		}
		h += "</form>" ;
		h += "<div id='wdq_editor_dropdown_autodesc'></div>" ;
		h += "</div>" ;
		$('body').append ( h ) ;
		
		function storeEdit () {
			var t = $('#wdq_editor_dropdown_input').val() ;
			
			function update () {
				var q = self.generateQuery ( self.structure ) ;
				var query = self.node.find('input.wdq_editor_query') ;
				query.val ( q ) ;
				$('#wdq_editor_dropdown').remove() ;
			}
			
			if ( ib.key == 'float' || ib.key == 'string' || ib.key == 'date' || ib.key == 'site' ) {
				var k = ib.key == 'string' ? 's' : ib.key ;
				ib.o[k] = t ;
				o.html ( t ) ;
				return update() ;
			}
			
			t = $('#wdq_editor_dropdown_select option:selected').val() ;
			if ( typeof t == 'undefined' ) {
				alert ( "Please select one of the options" ) ;
				return ;
			}
			var tnum = t.substr(1) ;
			
			ib.o[ib.key] = tnum ;
			self.loadWD ( [ t ] , function () {
				o.html ( self.getLabel ( t ) ) ;
				return update() ;
			} ) ;
		}
		
		
		var off = o.offset() ;
		var x = off.left ;
		var y = off.top + o.height() ;
		var right = window.innerWidth ;
		$('#wdq_editor_dropdown').offset ( { top:y , left:x } ) ;
		if ( x + $('#wdq_editor_dropdown').width() + 20 > right ) {
			x = right - $('#wdq_editor_dropdown').width() - 20 ;
			$('#wdq_editor_dropdown').offset ( { top:y , left:x } ) ;
		}
		
		$('#wdq_editor_dropdown_close').click ( function () {
			$('#wdq_editor_dropdown').remove() ;
		} ) ;
		$('#wdq_editor_dropdown_form').submit ( function ( e ) {
			e.preventDefault() ;
			storeEdit() ;
			return ;
		} ) ;
		$('#wdq_editor_dropdown_select').dblclick ( function () {
			$('#wdq_editor_dropdown_select').submit() ;
		} ) ;

		if ( ib.key == 'prop' || ib.key == 'item' ) {
			var t = o.text().replace ( /\s*\[.\d+\]$/ , '' ) ;
			$('#wdq_editor_dropdown_input').val ( t ) ;
		} else {
			var t = $.trim(o.text()) ;
			$('#wdq_editor_dropdown_input').val ( t ) ;
		}
		$('#wdq_editor_dropdown_input').focus() ;

		var search_queue = [] ;
		var search_running = false ;
		var current_search = '' ;

		function do_search ( search_query ) {
			if ( search_query == current_search ) return ;
			if ( search_running ) {
				search_queue.push ( search_query ) ;
				return ;
			}
			search_running = true ;
			current_search = search_query ;
			$('#wdq_editor_dropdown_searching').show() ;
			$('#wdq_editor_dropdown_autodesc').html('').css({'background-color':'white'}) ;
			
			$.getJSON ( '//www.wikidata.org/w/api.php?callback=?' , {
				action:'wbsearchentities',
				limit:10,
				format:'json',
				language:self.lang,
				type:(ib.key=='prop')?'property':'item',
				search:search_query
			} , function ( d ) {
				var h = [] ;
				$.each ( (d.search||[]) , function ( k , v ) {
					var ho = "<option value='" + v.id + "'>" + v.label + " [" + v.id + "]" ;
					ho += "</option>" ;
					h.push ( ho ) ;
				} ) ;
				$('#wdq_editor_dropdown_select').html ( h.join('') ) ;
				search_running = false ;
				if ( search_queue.length > 0 ) {
					var sq = search_queue.pop() ;
					search_queue = [] ;
					do_search ( sq ) ;
				} else {
					$('#wdq_editor_dropdown_searching').hide() ;
				}
			} ) ;
		}

		function updateAfterEdit () {
			if ( ib.key == 'float' || ib.key == 'string' || ib.key == 'date' || ib.key == 'site' ) return ;
			
			if ( ib.key == 'prop' || ib.key == 'item' ) {
				var search_query = $('#wdq_editor_dropdown_input').val() ;
				do_search ( search_query ) ;
			}
		}
		
		$('#wdq_editor_dropdown_select').change ( function () {
			if ( typeof wd_auto_desc == undefined ) return ; // autodesc not loaded
			var q = $('#wdq_editor_dropdown_select option:selected').val() ;
			$('#wdq_editor_dropdown_autodesc').html('<i>Loading description...</i>').css({'background-color':'white'}) ;
			wd_auto_desc.loadItem ( q , {
				target:$('#wdq_editor_dropdown_autodesc')
			} ) ;
		} ) ;

		$('#wdq_editor_dropdown_select').keyup ( function (e) {
			if (e.keyCode == 27) { // Escape
				e.preventDefault();
				$('#wdq_editor_dropdown').remove() ;
				return ;
			}
			if (e.keyCode == 13) { // Return
				e.preventDefault();
				storeEdit() ;
			}
		} ) ;

		$('#wdq_editor_dropdown_input').keyup ( function (e) {
			if (e.keyCode == 27) { // Escape
				e.preventDefault();
				$('#wdq_editor_dropdown').remove() ;
				return ;
			}
			if ( ( ib.key == 'prop' || ib.key == 'item' ) && e.keyCode == 40 ) { // Cursor down
				$('#wdq_editor_dropdown_select').focus() ;
				e.preventDefault();
				$("#wdq_editor_dropdown_select option:first").prop('selected',true	);
				$('#wdq_editor_dropdown_select').change();
			} else {
				updateAfterEdit() ;
			}
		} ) ;
		
		updateAfterEdit() ;
		
	}
	
	this.hasLabel = function ( q ) {
		var i = self.wdcache[q] ;
		if ( typeof i == 'undefined' ) return false ;
		return true ;
	}
	
	this.getLabel = function ( q ) {
		var i = self.wdcache[q] ;
		if ( typeof i == 'undefined' ) return q ;
		var lang = self.lang ;
		if ( typeof (i.labels||{})[lang] != 'undefined' ) return i.labels[lang].value + '<small> ['+q+']</small>' ;
		return q ;
	}
	
	this.loadWD = function ( to_load_orig , callback ) {
		var to_load = $.extend ( [] , to_load_orig ) ;
		var cnt = 0 ;
		while ( to_load.length > 0 ) {
			var tmp = [] ;
			while ( to_load.length > 0 && tmp.length < 50 ) tmp.push ( to_load.shift() ) ;
			cnt++ ;
			$.getJSON ( '//www.wikidata.org/w/api.php?callback=?' , {
				action:'wbgetentities',
				ids:tmp.join('|') ,
				format:'json'
			} , function ( d ) {
				$.each ( (d.entities||[]) , function ( k , v ) {
					self.wdcache[k] = v ;
				} ) ;
				cnt-- ;
				if ( cnt == 0 && typeof callback != 'undefined' ) callback() ;
			} ) ;
		}
		if ( cnt == 0 && typeof callback != 'undefined' ) callback() ;
	}
	
	this.init = function () {
		var h = '' ;
		h += "<div>" ;
		h += "<input type='text' class='wdq_editor_query' value='' />" ;
		h += "</div>" ;
		h += "<div class='wdq_editor_main_block_wrapper'>" ;
		h += '<div class="wdq_editor_main_block">' ;
		h += "</div>" ;
		h += "</div>" ;
		self.node.html ( h ) ;
		var query = self.node.find('input.wdq_editor_query') ;
		query.keyup ( function () {
			self.parse ( query.val() , true ) ;
		} ) ;
	}
	
	this.generateQuery = function ( s ) {
		var ret = [] ;

		function fixup  ( list ) {
			var ret = [] ;
			$.each ( list , function ( k , v ) {
				if ( typeof v.remove_me != 'undefined' ) return
				ret.push ( v ) ;
			} ) ;
			return ret ;
		}

		function joinSub ( list , key ) {
			var ret = [] ;
			$.each ( list , function ( k , v ) {
				ret.push ( v[key] ) ;
			} ) ;
			return ret.join(',') ;
		}
		
		$.each ( s , function ( k , v ) {
			var t = '' ;
			if ( v.s == '()' ) {
				ret.push ( '(' + self.generateQuery ( v.sub ) + ')' ) ;
			} else if ( v.s == 'CLAIM' || v.s == 'NOCLAIM' ) {
				var n = [] ;
				$.each ( v.params , function ( k2 , v2 ) {
					if ( v2.type == 'prop' ) n.push ( v2.prop ) ;
					else if ( v2.type == 'prop_item' ) n.push ( v2.prop+':'+v2.item ) ;
					else if ( v2.type == 'prop_sub' ) n.push ( v2.prop+':('+self.generateQuery(v2.sub)+')' ) ;
				} ) ;
				t = v.s + '[' + n.join(',') + ']' ;
			} else if ( v.s == 'TREE' ) {
				t += v.s ;
				t += '[' + joinSub ( fixup(v.items) , 'item' ) + ']' ;
				t += '[' + joinSub ( fixup(v.props) , 'prop' ) + ']' ;
				if ( v.rprops.length > 0 ) t += '[' + joinSub ( fixup(v.rprops) , 'prop' ) + ']' ;
			} else if ( v.s == 'WEB' ) {
				t += v.s ;
				t += '[' + joinSub ( fixup(v.items) , 'item' ) + ']' ;
				t += '[' + joinSub ( fixup(v.props) , 'prop' ) + ']' ;
			} else if ( v.s == 'STRING' ) {
				var n = [] ;
				$.each ( fixup(v.params) , function ( k2 , v2 ) { n.push ( v2.prop+":"+JSON.stringify(v2.s) ) } ) ;
				t += v.s + '[' + n.join(',') + ']' ;
			} else if ( v.s == 'AROUND' ) {
				t += v.s + '[' + v.params[0].prop + ',' + v.params[1].float + ',' + v.params[2].float + ',' + v.params[3].float + ']' ;
			} else if ( v.s == 'BETWEEN' ) {
				t += v.s + '[' + v.params[0].prop + ',' + v.params[1].date + ',' + v.params[2].date + ']' ;
			} else if ( v.s == 'QUANTITY' ) {
				t += v.s + '[' + v.params[0].prop + ':' + v.params[1].float ;
				if ( v.params[2].float != '' ) t += ',' + v.params[2].float ;
				t += ']' ;
			} else if ( v.s == 'LINK' || v.s == 'NOLINK' ) {
				t += v.s ;
				t += '[' + joinSub ( fixup(v.params) , 'site' ) + ']' ;
			} else {
				t = v.s ;
			}
			if ( typeof v.qualifier != 'undefined' ) {
				t += '{' + self.generateQuery(v.qualifier) + '}' ;
			}
			if ( t != '' ) ret.push ( t ) ;
		} ) ;
		return ret.join ( ' ' ) ;
	}

	self.init() ;
	
}
