#include "wd_inmem.h"


template <class T> void TStatementList<T>::findMatches ( TPropertyNumber p , map <T,bool> &targets , TItemQuery <TQualifiers> *ql , TIntermediateResult &hadthat ) {
	if ( p >= list.size() ) return ; // Out-of-bounds
	
/*
// Nice try...
	if ( false ) {
		cout << "Using method 1" << endl ;
	
		vector < pair <T,uint32_t> > tmp ;
		tmp.reserve ( list[p].size() ) ;
		for ( uint32_t a = 0 ; a < list[p].size() ; a++ ) {
			tmp.push_back ( pair <T,uint32_t> ( list[p][a].value , a ) ) ;
		}
		cout << "A1" << endl ;
		sort ( tmp.begin() , tmp.end() ) ;
		cout << "A2" << endl ;
		
		vector <T> targets2 ;
		targets2.reserve ( targets.size() ) ;
		for ( auto i = targets.begin() ; i != targets.end() ; i++ ) {
			targets2.push_back ( i->first ) ;
		}
		cout << "B1" << endl ;
		sort ( targets2.begin() , targets2.end() ) ;
		cout << "B2" << endl ;
		
		uint32_t pl = 0 , pt = 0 ;
		while ( pl < tmp.size() && pt < targets2.size() ) {
			if ( tmp[pl].first < targets2[pt] ) { pl++ ; continue ; }
			if ( targets2[pt] < tmp[pl].first ) { pt++ ; continue ; }
			
			uint32_t a = tmp[pl].second ;
			if ( ql ) { // Looking for qualifier matches
				if ( !list[p][a].hasQualifiers() ) continue ; // No qualifiers; next victim!
				ql->run ( list[p][a].getQualifiers() ) ;
				if ( ql->result.size() == 0 ) continue ; // No matches
			}
			
			hadthat.addItem(list[p][a].item) ;
			pl++ ;
		}
		cout << "C1" << endl ;
	
	
	} else {
*/	



	for ( uint32_t a = 0 ; a < list[p].size() ; a++ ) {
		if ( targets.find(list[p][a].value) != targets.end() ) {

			if ( ql ) { // Looking for qualifier matches
				if ( !list[p][a].hasQualifiers() ) continue ; // No qualifiers; next victim!
				ql->run ( list[p][a].getQualifiers() ) ;
				if ( ql->result.size() == 0 ) continue ; // No matches
			}
	
			hadthat.addItem(list[p][a].item) ;
		}
	}
	
}

template <class T> void TStatementList<T>::findBetween ( TPropertyNumber p , T from , T to , TItemQuery <TQualifiers> *ql , TIntermediateResult &hadthat ) {
	if ( p >= list.size() ) return ; // Out-of-bounds
	for ( uint32_t a = 0 ; a < list[p].size() ; a++ ) { // TODO speed up with the vector between thingy
		if ( list[p][a].value < from ) continue ; // from.is_initialized ?!?
		if ( to < list[p][a].value ) break ; // to.is_initialized &&  ?!?

		if ( ql ) { // Looking for qualifier matches
			if ( !list[p][a].hasQualifiers() ) continue ; // No qualifiers; next victim!
			ql->run ( list[p][a].getQualifiers() ) ;
			if ( ql->result.size() == 0 ) continue ; // No matches
		}

		hadthat.addItem(list[p][a].item) ;
	}
}

template <class T> void TStatementList<T>::findAround ( TAroundCoordinate &a , TItemQuery <TQualifiers> *ql , TIntermediateResult &hadthat ) {
	if ( a.prop >= list.size() ) return ; // Out-of-bounds
	for ( uint32_t i = 0 ; i < list[a.prop].size() ; i++ ) {
		if ( list[a.prop][i].value.isAround(a.coord,a.radius) ) {

			if ( ql ) { // Looking for qualifier matches
				if ( !list[a.prop][i].hasQualifiers() ) continue ; // No qualifiers; next victim!
				ql->run ( list[a.prop][i].getQualifiers() ) ;
				if ( ql->result.size() == 0 ) continue ; // No matches
			}

			hadthat.addItem(list[a.prop][i].item) ;
		}
	}
}


template <class T> void TStatementList<T>::hadThatProp ( TPropertyNumber prop , TIntermediateResult &hadthat , TItemQuery <TQualifiers> *ql ) {
	if ( prop >= list.size() ) return ;
	
	if ( ql ) { // Looking for qualifier matches
		for ( uint32_t a = 0 ; a < list[prop].size() ; a++ ) {
			if ( !list[prop][a].qualifiers ) continue ; // No qualifiers; next victim!
			bool success = ql->run ( list[prop][a].qualifiers ) ;
			if ( ql->result.size() == 0 ) continue ; // No matches
			hadthat.addItem(list[prop][a].item) ;
		}
	} else {
		for ( uint32_t a = 0 ; a < list[prop].size() ; a++ ) {
			hadthat.addItem(list[prop][a].item) ;
		}
	}

}


//________________________________________________________________________________________________




template <class T> string TItemQuery<T>::describe () {
	string ret ;
	guessMode() ; // Just in case...
	if ( subqueries.size() > 0 ) {
		for ( uint32_t a = 0 ; a < subqueries.size() ; a++ ) {
			if ( a > 0 ) ret += mode == IQ_SUBQUERIES_AND ? " AND " : " OR " ;
			ret += subqueries[a].describe() ;
		}
		if ( subqueries.size() > 1 ) ret = "(" + ret + ")" ;
	} else if ( mode == IQ_CHAINS ) {
		std::ostringstream s ;
		s << "TREE[" ;
		for ( uint32_t a = 0 ; a < root_items.size() ; a++ ) { if(a>0)s<<","; s<<root_items[a]; }
		s << "][" ;
		for ( uint32_t a = 0 ; a < follow_forward.size() ; a++ ) { if(a>0)s<<","; s<<follow_forward[a]; }
		s << "]" ;
		if ( follow_reverse.size() > 0 ) {
			s << "[" ;
			for ( uint32_t a = 0 ; a < follow_reverse.size() ; a++ ) { if(a>0)s<<","; s<<follow_reverse[a]; }
			s << "]" ;
		}
		ret = s.str() ;
	} else if ( mode == IQ_WEB ) {
		std::ostringstream s ;
		s << "WEB[" ;
		for ( uint32_t a = 0 ; a < root_items.size() ; a++ ) { if(a>0)s<<","; s<<root_items[a]; }
		s << "][" ;
		for ( uint32_t a = 0 ; a < follow_forward.size() ; a++ ) { if(a>0)s<<","; s<<follow_forward[a]; }
		s << "]" ;
		ret = s.str() ;
	} else if ( mode == IQ_HAS_CLAIM ) {
		std::ostringstream s ;
		s << "CLAIM[" ;
		for ( uint32_t a = 0 ; a < has_claims.size() ; a++ ) {
			if ( a > 0 ) s << "," ;
			s << has_claims[a].asString() ;
//			s << has_claims[a].prop ;
//			if ( has_claims[a].second != 0 ) s << ":" << has_claims[a].second ;
		}
		s << "]" ;
		ret = s.str() ;
	} else if ( mode == IQ_STRING ) {
		std::ostringstream s ;
		s << "STRING[" ;
		for ( uint32_t a = 0 ; a < has_strings.size() ; a++ ) {
			if ( a > 0 ) s << "," ;
			s << has_strings[a].first ;
			if ( !has_strings[a].second.empty() ) s << ":'" << has_strings[a].second << "'" ;
		}
		s << "]" ;
		ret = s.str() ;
	} else if ( mode == IQ_BETWEEN ) {
		std::ostringstream s ;
		s << "BETWEEN[" ;
		TBetween t = has_between[0] ;
		s << t.first << "," ;
		s << t.second.first.toString() << "," ;
		s << t.second.second.toString() << "]" ;
		ret = s.str() ;
	} else if ( mode == IQ_QUANTITY ) {
		std::ostringstream s ;
		s << "QUANTITY[" ;
		TQuantityRange t = has_quantity[0] ;
		s << t.first << "," ;
		s << t.second.first << "," ;
		s << t.second.second << "]" ;
		ret = s.str() ;
	} else if ( mode == IQ_ITEMS ) {
		size_t l = has_claims[0].items.size() ;
		if ( l <= 10 ) {
			std::ostringstream s ;
			s << "ITEMS[" ;
			for ( size_t a = 0 ; a < l ; a++ ) {
				if ( a > 1 ) s << "," ;
				s << has_claims[0].items[a] ;
			}
			s << "]" ;
			ret = s.str() ;
		} else {
			ret += "ITEMS[...]" ;
		}
		std::ostringstream s ;
	} else if ( mode == IQ_AROUND ) {
		std::ostringstream s ;
		s << "AROUND[" ;
		s << has_around[0].prop ;
		s << "," ;
		s << has_around[0].coord.latitude ;
		s << "," ;
		s << has_around[0].coord.longitude ;
		s << "," ;
		s << has_around[0].radius ;
		s << "]" ;
		ret = s.str() ;
	} else if ( mode == IQ_HAS_LINK || mode == IQ_NO_LINK ) {
		ret = mode == IQ_HAS_LINK ? "LINK[" : "NOLINK[" ;
		for ( uint32_t a = 0 ; a < has_link.size() ; a++ ) {
			if ( a > 0 ) ret += "," ;
			ret += has_link[a] ;
		}
		ret += "]" ;
	} else if ( mode == IQ_NO_CLAIM ) {
		std::ostringstream s ;
		s << "NOCLAIM[" ;
		for ( uint32_t a = 0 ; a < has_claims.size() ; a++ ) {
			if ( a > 0 ) s << "," ;
			s << has_claims[a].asString() ;
//			s << has_claims[a].first ;
//			if ( has_claims[a].second != 0 ) s << ":" << has_claims[a].second ;
		}
		s << "]" ;
		ret = s.str() ;
	} else {
		ret = "??" ;
	}
	
	if ( qualifier_query ) {
		ret += "{" + qualifier_query->describe() + "}" ;
	}
	
	return ret ;
}

template <class T> bool TItemQuery<T>::constructItemList ( list <string> &parts , vector <TItem> &ret ) {
	ret.clear() ;

	if ( parts.size() == 0 || parts.front() != "[" ) return false ; // Syntax error
	parts.pop_front() ; // "["
	while ( parts.size() > 0 && parts.front() != "]" ) {
		if ( parts.size() == 0 ) return false ; // Premature end of list
		string p = parts.front() ;
		parts.pop_front() ;
		if ( p == "," ) continue ;
		ret.push_back ( atol ( p.c_str() ) ) ;
	}
	parts.pop_front() ; // "]"
	
	return true ;
}

template <class T> bool TItemQuery<T>::constructStringList ( list <string> &parts , vector <Tppns> &ret ) {
	ret.clear() ;

	if ( parts.size() == 0 || parts.front() != "[" ) return false ; // Syntax error
	parts.pop_front() ; // "["
	while ( parts.size() > 0 && parts.front() != "]" ) {
		if ( parts.size() == 0 ) return false ; // Premature end of list
		string p = parts.front() ;
		parts.pop_front() ;
		if ( parts.size() == 0 ) return false ; // Premature end of list
		if ( p == "," ) continue ;
		
		Tppns claim ;
		claim.first = atol ( p.c_str() ) ; // Property
		if ( parts.front() == ":" ) { // Specific string
			parts.pop_front() ; // ":"
			if ( parts.size() == 0 ) return false ; // Premature end of list
			p = parts.front() ;
			parts.pop_front() ;
			claim.second = p.c_str() ; // Item
		} else claim.second = "" ; // Any string
		
		ret.push_back ( claim ) ;
	}
	if ( parts.size() > 0 ) parts.pop_front() ; // "]"
	else return false ;
	
	return true ;
}

template <class T> bool TItemQuery<T>::constructTimeList ( list <string> &parts , vector <TBetween> &ret ) { // Pattern: PROPERTY,[FROM][,TO]
	ret.clear() ;

	// Re-join ":" for dates
	list <string> p2 ;
	bool endq = false ;
	for ( list <string>::iterator a = parts.begin() ; a != parts.end() ; a++ ) {
		if ( !endq && (*a) == ":" ) {
			if ( p2.size() == 0 ) return false ;
			string s = p2.back() ;
			p2.pop_back() ;
			s += *a ;
			a++ ;
			s += *a ;
			p2.push_back ( s ) ;
		} else {
			p2.push_back ( *a ) ;
			if ( *a == "]" ) endq = true ;
		}
	}
	parts.swap ( p2 ) ;


	if ( parts.size() == 0 || parts.front() != "[" ) return false ; // Syntax error
	parts.pop_front() ; // "["
	if ( parts.size() == 0 ) return false ; // Premature end of list
	
	TBetween t ;
	string p = parts.front() ;
	parts.pop_front() ;
	t.first = atol ( p.c_str() ) ; // Property

	if ( parts.size() == 0 ) return false ; // Premature end of list

	p = parts.front() ;
	parts.pop_front() ;
	if ( parts.size() == 0 ) return false ; // Premature end of list
	if ( p != "," ) return false ;
	
	p = parts.front() ;
	parts.pop_front() ;
	
	if ( p != "," ) { // Has "FROM" date
		if ( !t.second.first.parseString((char*)p.c_str()) ) return false ; // Not a time
	
		if ( parts.size() == 0 ) return false ; // Premature end of list
	
		p = parts.front() ;
		parts.pop_front() ;

		if ( p == "]" ) { // Only 'from'
			ret.push_back ( t ) ;
			return true ;
		}

	}
	
	if ( parts.size() == 0 ) return false ; // Premature end of list
	if ( p != "," ) return false ; // Needs to be ","
	
	p = parts.front() ;
	parts.pop_front() ;
	if ( parts.size() == 0 ) return false ; // Premature end of list

	// "TO" date
	if ( !t.second.second.parseString((char*)p.c_str()) ) return false ; // Not a time
	
	p = parts.front() ;
	parts.pop_front() ;
	
	if ( p != "]" ) return false ;
	
	ret.push_back ( t ) ;
	return true ;
}

template <class T> bool TItemQuery<T>::construcTQuantityList ( list <string> &parts , vector <TQuantityRange> &ret ) { // Pattern: PROPERTY,[FROM][,TO]
	ret.clear() ;

	// Re-join ":" for dates
	list <string> p2 ;
	bool endq = false ;
	for ( list <string>::iterator a = parts.begin() ; a != parts.end() ; a++ ) {
		if ( !endq && (*a) == ":" ) {
			if ( p2.size() == 0 ) return false ;
			string s = p2.back() ;
			p2.pop_back() ;
			s += *a ;
			a++ ;
			s += *a ;
			p2.push_back ( s ) ;
		} else {
			p2.push_back ( *a ) ;
			if ( *a == "]" ) endq = true ;
		}
	}
	parts.swap ( p2 ) ;


	if ( parts.size() == 0 || parts.front() != "[" ) return false ; // Syntax error
	parts.pop_front() ; // "["
	if ( parts.size() == 0 ) return false ; // Premature end of list
	
	TQuantityRange t ;
	string p = parts.front() ;
	parts.pop_front() ;
	t.first = atol ( p.c_str() ) ; // Property

	if ( parts.size() == 0 ) return false ; // Premature end of list

	p = parts.front() ;
	parts.pop_front() ;
	if ( parts.size() == 0 ) return false ; // Premature end of list
	if ( p != "," ) return false ;
	
	p = parts.front() ;
	parts.pop_front() ;
	
	if ( p != "," ) { // Has "FROM" date
		t.second.first = atof ( p.c_str() ) ;
	
		if ( parts.size() == 0 ) return false ; // Premature end of list
	
		p = parts.front() ;
		parts.pop_front() ;

		if ( p == "]" ) { // Only 'from'
			t.second.second = t.second.first ;
			ret.push_back ( t ) ;
			return true ;
		}

	}
	
	if ( parts.size() == 0 ) return false ; // Premature end of list
	if ( p != "," ) return false ; // Needs to be ","
	
	p = parts.front() ;
	parts.pop_front() ;
	if ( parts.size() == 0 ) return false ; // Premature end of list

	// "TO" date
	t.second.second = atof ( p.c_str() ) ;
	
	p = parts.front() ;
	parts.pop_front() ;
	
	if ( p != "]" ) return false ;
	
	ret.push_back ( t ) ;
	return true ;
}

#define PARTS_ENSURE(s_) { if ( parts.size() == 0 || parts.front() != s_ ) return false ; parts.pop_front() ; }
#define PARTS_INT(l_) { if ( parts.size() == 0 ) return false ; string p = parts.front() ; parts.pop_front() ; l_ = atol(p.c_str()) ; }
#define PARTS_FLOAT(f_) { if ( parts.size() == 0 ) return false ; string p = parts.front() ; parts.pop_front() ; f_ = atof(p.c_str()) ; }
template <class T> bool TItemQuery<T>::constructCoordList ( list <string> &parts , vector <TAroundCoordinate> &ret ) {
	ret.clear() ;
	
	TAroundCoordinate a ;
	PARTS_ENSURE ( "[" ) ;
	PARTS_INT ( a.prop ) ;
	PARTS_ENSURE ( "," ) ;
	PARTS_FLOAT ( a.coord.latitude ) ;
	PARTS_ENSURE ( "," ) ;
	PARTS_FLOAT ( a.coord.longitude ) ;
	PARTS_ENSURE ( "," ) ;
	PARTS_FLOAT ( a.radius ) ;
	PARTS_ENSURE ( "]" ) ;

	ret.push_back ( a ) ;
	return true ;
}

template <class T> bool TItemQuery<T>::getItemOrNestedQueryResults ( list <string> &parts , THasClaim &hc ) {
	if ( parts.size() == 0 ) return false ; // Premature end of list
	if ( parts.front() == "(" ) {
		int cnt = 0 ;
		string nested_query ;
		do {
			if ( parts.size() == 0 ) return false ; // Premature end of list
			if ( parts.front() == "(" ) cnt++ ;
			else if ( parts.front() == ")" ) cnt-- ;
			nested_query += " " + parts.front() ;
			parts.pop_front() ;
		} while ( cnt > 0 ) ;
		if ( parts.size() == 0 ) return false ; // Premature end of list
//		cout << "Nested query : " << nested_query << endl ;
		TItemQuery nq ;
		if ( !nq.parse ( nested_query ,  *w_  ) ) return false;
		nq.run () ;
		hc.query = nq.describe() ;
		for ( uint32_t a = 0 ; a < nq.result.size() ; a++ ) {
			hc.items.push_back ( nq.result[a] ) ;
//			the_items.push_back ( nq.result[a] ) ;
		}
//		cout << "Nested query yielded " << nq.result.size() << " results" << endl ;
	} else {
		string p = parts.front() ;
		parts.pop_front() ;
		hc.items.push_back ( atol ( p.c_str() ) ) ;
//		the_items.push_back ( atol ( p.c_str() ) ) ;
	}
	return true ;
}

template <class T> bool TItemQuery<T>::constructClaimList ( list <string> &parts , vector <THasClaim> &ret ) {
	ret.clear() ;

	if ( parts.size() == 0 || parts.front() != "[" ) return false ; // Syntax error
	parts.pop_front() ; // "["
	while ( parts.size() > 0 && parts.front() != "]" ) {
		if ( parts.size() == 0 ) return false ; // Premature end of list
		string p = parts.front() ;
		parts.pop_front() ;
		if ( parts.size() == 0 ) return false ; // Premature end of list
		if ( p == "," ) continue ;
		
		THasClaim hc ;
		hc.prop = atol ( p.c_str() ) ;
		

		if ( parts.front() == ":" ) { // Specific item
			parts.pop_front() ; // ":"
			if ( !getItemOrNestedQueryResults ( parts , hc ) ) return false ;
/*			if ( parts.size() == 0 ) return false ; // Premature end of list
			p = parts.front() ;
			parts.pop_front() ;
			the_items.push_back ( atol ( p.c_str() ) ) ;*/
		}// else the_items.push_back ( 0 ) ; // Any item
/*
		for ( uint32_t a = 0 ; a < the_items.size() ; a++ ) {
			tpi claim ;
			claim.first = the_property ; // Property
			claim.second = the_items[a] ; // Item
			ret.push_back ( claim ) ;
		}*/
		ret.push_back ( hc ) ;
	}
	if ( parts.size() > 0 ) parts.pop_front() ; // "]"
	else return false ;
	
	return true ;
}

template <class T> bool TItemQuery<T>::constructItemsList ( list <string> &parts , vector <THasClaim> &ret ) {
	ret.clear() ;

	THasClaim hc ;
	if ( parts.size() == 0 || parts.front() != "[" ) return false ; // Syntax error
	parts.pop_front() ; // "["
	while ( parts.size() > 0 && parts.front() != "]" ) {
		if ( parts.size() == 0 ) return false ; // Premature end of list
		string p = parts.front() ;
		parts.pop_front() ;
		if ( parts.size() == 0 ) return false ; // Premature end of list
		if ( p == "," ) continue ;
		hc.items.push_back ( atol ( p.c_str() ) ) ;
	}

	ret.push_back ( hc ) ;
	if ( parts.size() > 0 ) parts.pop_front() ; // "]"
	else return false ;
	
	return true ;
}

template <class T> bool TItemQuery<T>::constructLinkList ( list <string> &parts , vector <string> &ret ) {
	ret.clear() ;

	if ( parts.size() == 0 || parts.front() != "[" ) return false ; // Syntax error
	parts.pop_front() ; // "["
	while ( parts.size() > 0 && parts.front() != "]" ) {
		if ( parts.size() == 0 ) return false ; // Premature end of list
		string p = parts.front() ;
		parts.pop_front() ;
		if ( parts.size() == 0 ) return false ; // Premature end of list
		if ( p == "," ) continue ;
		ret.push_back ( p ) ;
		cerr << "ADDING LINK " << p << endl ;
	}
	
	if ( parts.size() > 0 ) parts.pop_front() ; // "]"
	else return false ;
	
	return true ;
}

template <class T> bool TItemQuery<T>::extractSubList ( list <string> &parts , list <string> &sublist , string begin , string end ) {
	int cnt = 1 ;
	while ( cnt > 0 ) {
		if ( parts.size() == 0 ) return false ;
		string p2 = parts.front() ;
		parts.pop_front() ;
		
		if ( p2 == end ) {
			cnt-- ;
			if ( cnt > 0 ) sublist.push_back ( p2 ) ;
		} else if ( p2 == begin ) {
			cnt++ ;
			sublist.push_back ( p2 ) ;
		} else sublist.push_back ( p2 ) ;
	}
	return true ;
}

template <class T> bool TItemQuery<T>::tryParseQualifiers ( list <string> &parts , TItemQuery <T> &q ) {
	if ( parts.size() < 3 ) return true ;
	if ( parts.front() != "{" ) return true ;
	parts.pop_front() ;

	list <string> l ;
	if ( !extractSubList ( parts , l , "{" , "}" ) ) return false ;
	
	q.qualifier_query = new TItemQuery <TQualifiers> ;
	q.qualifier_query->constructQuery ( l ) ;
	
	return true ;
}

template <class T> bool TItemQuery<T>::constructQuery ( list <string> &parts , T *w ) {
	if ( w && !w_ ) w_ = w ;
	while ( parts.size() > 0 ) {
		string p = parts.front() ;
		parts.pop_front() ;
		std::transform(p.begin(), p.end(),p.begin(), ::toupper);

		if ( p == "TREE" ) {

			if ( parts.size() == 0 || parts.front() != "[" ) return false ; // Syntax error
			TItemQuery q ;
			if ( !constructItemList ( parts , q.root_items ) ) return false ;
			if ( parts.size() == 0 || parts.front() != "[" ) return false ; // Syntax error
			vector <TItem> i ;
			if ( !constructItemList ( parts , i ) ) return false ;
			for ( uint32_t a = 0 ; a < i.size() ; a++ ) q.follow_forward.push_back ( i[a].item ) ;
			if ( parts.size() > 0 && parts.front() == "[" ) { // Reverse follow
				i.clear() ;
				if ( !constructItemList ( parts , i ) ) return false ;
				for ( uint32_t a = 0 ; a < i.size() ; a++ ) q.follow_reverse.push_back ( i[a].item ) ;
			}
			q.mode = IQ_CHAINS ;
			subqueries.push_back ( q ) ;

		} else if ( p == "WEB" ) {

			if ( parts.size() == 0 || parts.front() != "[" ) return false ; // Syntax error
			TItemQuery q ;
			if ( !constructItemList ( parts , q.root_items ) ) return false ;
			if ( parts.size() == 0 || parts.front() != "[" ) return false ; // Syntax error
			vector <TItem> i ;
			if ( !constructItemList ( parts , i ) ) return false ;
			for ( uint32_t a = 0 ; a < i.size() ; a++ ) q.follow_forward.push_back ( i[a].item ) ;
			q.mode = IQ_WEB ;
			subqueries.push_back ( q ) ;

		} else if ( p == "AND" || p == "OR" ) {

			uint32_t nm = p == "AND" ? IQ_SUBQUERIES_AND : IQ_SUBQUERIES_OR ;
			if ( mode == IQ_UNKNOWN ) mode = nm ;
			else if ( mode != nm ) { // Change mode
				TItemQuery q ;
				q.mode = mode ;
				q.subqueries = subqueries ;
				subqueries.clear() ;
				subqueries.push_back ( q ) ;
				mode = nm ;
			}

		} else if ( p == "CLAIM" ) {
			
			TItemQuery q ;
			if ( !constructClaimList ( parts , q.has_claims ) ) return false ;
			tryParseQualifiers ( parts , q ) ;
			subqueries.push_back ( q ) ;

		} else if ( p == "NOCLAIM" ) {
			
			TItemQuery q ;
			if ( !constructClaimList ( parts , q.has_claims ) ) return false ;
			q.mode = IQ_NO_CLAIM ;
			subqueries.push_back ( q ) ;

		} else if ( p == "STRING" ) {

			TItemQuery q ;
			if ( !constructStringList ( parts , q.has_strings ) ) return false ;
			tryParseQualifiers ( parts , q ) ;
			q.mode = IQ_STRING ;
			subqueries.push_back ( q ) ;

		} else if ( p == "AROUND" ) {
		
			TItemQuery q ;
			if ( !constructCoordList ( parts , q.has_around ) ) return false ;
			tryParseQualifiers ( parts , q ) ;
			q.mode = IQ_AROUND ;
			subqueries.push_back ( q ) ;
		
		} else if ( p == "LINK" || p == "NOLINK" ) {
		
			TItemQuery q ;
			if ( !constructLinkList ( parts , q.has_link ) ) return false ;
			tryParseQualifiers ( parts , q ) ;
			q.mode = p == "LINK" ? IQ_HAS_LINK : IQ_NO_LINK ;
			subqueries.push_back ( q ) ;
		
		} else if ( p == "BETWEEN" ) {

			TItemQuery q ;
			if ( !constructTimeList ( parts , q.has_between ) ) return false ;
			tryParseQualifiers ( parts , q ) ;
			q.mode = IQ_BETWEEN ;
			subqueries.push_back ( q ) ;

		} else if ( p == "QUANTITY" ) {

			TItemQuery q ;
			if ( !construcTQuantityList ( parts , q.has_quantity ) ) return false ;
			tryParseQualifiers ( parts , q ) ;
			q.mode = IQ_QUANTITY ;
			subqueries.push_back ( q ) ;
		
		} else if ( p == "ITEMS" ) {

			TItemQuery q ;
			if ( !constructItemsList ( parts , q.has_claims ) ) return false ;
			tryParseQualifiers ( parts , q ) ;
			q.mode = IQ_ITEMS ;
			subqueries.push_back ( q ) ;

		} else if ( p == "(" ) {
		
			list <string> l ;
			if ( !extractSubList ( parts , l , "(" , ")" ) ) return false ;
			
			TItemQuery q ;
			q.constructQuery ( l , w_ ) ;
			subqueries.push_back ( q ) ;

		} else return false ;
		
	}
	return true ;
}

/*
	tree[30][][17,131] and claims[138:676555] // Places in U.S. named after Francis of Assisi
	tree[729][][171 , 273 , 75 , 76 , 77 , 70 , 71 , 74 , 89] // All animals
	tree[4504][171 , 273 , 75 , 76 , 77 , 70 , 71 , 74 , 89] // Taxonomy of the Komodo dragon
*/

template <class T> bool TItemQuery<T>::parse ( string q , T &w ) {
	if ( &w ) {
		w_ = &w ;
		clog << "Queries running : " << w.getQueryCount() << endl ;
	} else {
		clog << "Web object undefined" << endl ;
	}
	clog << "Parsing query : " << q << endl ;

	// Lexer
	string last ;
	list <string> parts ;
	char quot = 0 ;
	for ( uint32_t c = 0 ; c < q.length() ; c++ ) {
		if ( quot != 0 ) { // In quote
			if ( q[c] == quot ) quot = 0 ; // end of quoted string
			else last += q[c] ;
			continue ;
		}
		if ( quot == 0 && ( q[c]=='"' || q[c] == 39 ) ) { // String start
			if ( !last.empty() ) parts.push_back ( last ) ;
			last.clear() ;
			quot = q[c] ;
			continue ;
		}
		if ( q[c]==' '||q[c]=='['||q[c]==']'||q[c]==','||q[c]==':'||q[c]=='('||q[c]==')'||q[c]=='{'||q[c]=='}' ) {
			if ( !last.empty() ) parts.push_back ( last ) ;
			if ( q[c] != ' ' ) parts.push_back ( string ( 1 , q[c] ) ) ;
			last.clear() ;
		} else last += q[c] ;
	}
	if ( !last.empty() ) parts.push_back ( last ) ;

	clog << "Parsing done for " << q << endl ;
	
	clog << "Constructing query representation for " << q << endl ;
	bool ret = constructQuery ( parts , w_ ) ;
	clog << "Construction " << (ret?"successfully done":"failed") << " for " << q << endl ;

	return ret ;
}

template <class T> void TItemQuery<T>::findItemsBetween ( TPropertyNumber p , TTime from , TTime to , T &w , TItemQuery <TQualifiers> *ql ) {
	w.times.findBetween ( p , from , to , ql , hadthat ) ;
}

template <class T> void TItemQuery<T>::findQuantities ( TPropertyNumber p , float from , float to , T &w , TItemQuery <TQualifiers> *ql ) {
	w.quantities.findBetween ( p , from , to , ql , hadthat ) ;
}

template <class T> void TItemQuery<T>::findItemsAround ( TAroundCoordinate a , T &w , TItemQuery <TQualifiers> *ql ) {
	w.coords.findAround ( a , ql , hadthat ) ;
}

template <class T> void TItemQuery<T>::findItemsWithString ( TPropertyNumber p , string i , T &w , TItemQuery <TQualifiers> *ql ) {
	map <TString,bool> targets ;
	targets[i] = true ;
	w.strings.findMatches ( p , targets , ql , hadthat ) ;
}

template <class T> void TItemQuery<T>::findItemsWithClaim ( THasClaim &hc , T &w , TItemQuery <TQualifiers> *ql ) {
	TPropertyNumber p = hc.prop ;
	
	if ( !hc.hasItems() ) {
		w.props.hadThatProp ( p , hadthat , ql ) ;
		w.strings.hadThatProp ( p , hadthat , ql ) ;
		w.coords.hadThatProp ( p , hadthat , ql ) ;
		w.times.hadThatProp ( p , hadthat , ql ) ;
		w.quantities.hadThatProp ( p , hadthat , ql ) ;
	} else {

		map <TItem,bool> targets ;
		for ( uint32_t ip = 0 ; ip < hc.items.size() ; ip++ ) {
			targets[hc.items[ip]] = true ;
		}
		
		w.props.findMatches ( p , targets , ql , hadthat ) ;
	}
	
}

template <class T> void TItemQuery<T>::guessMode () {
	if ( mode != IQ_UNKNOWN ) return ;
	if ( follow_forward.size()+follow_reverse.size() > 0 && root_items.size() > 0 ) mode = IQ_CHAINS ;
	else if ( subqueries.size() > 0 ) mode = IQ_SUBQUERIES_AND ;
	else if ( has_claims.size() > 0 ) mode = IQ_HAS_CLAIM ;
	else if ( has_strings.size() > 0 ) mode = IQ_STRING ;
	else if ( has_between.size() > 0 ) mode = IQ_BETWEEN ;
	else if ( has_quantity.size() > 0 ) mode = IQ_QUANTITY ;
	else if ( has_around.size() > 0 ) mode = IQ_AROUND ;
	else if ( has_link.size() > 0 ) mode = IQ_HAS_LINK ;
}

template <class T> void TItemQuery<T>::mergeResults ( vector <TItem> &r1 , vector <TItem> &r2 ) {
	uint32_t i1 = 0 , i2 = 0 ;
	vector <TItem> r ;
	
	if ( mode == IQ_SUBQUERIES_AND ) { // AND
//cout << "MERGING AND" << endl ;
		r.reserve ( r1.size() < r2.size() ? r1.size() : r2.size() ) ; // Result cannot be larger than the smallest sub-result
		while ( i1 < r1.size() && i2 < r2.size() ) {
			if ( r1[i1] == r2[i2] ) {
				r.push_back ( r1[i1] ) ;
				i1++ ;
				i2++ ;
			} else if ( r1[i1] < r2[i2] ) i1++ ;
			else i2++ ;
		}
	} else { // OR
//cout << "MERGING OR" << endl ;
		r.reserve ( r1.size() + r2.size() ) ; // Result cannot be larger than both sub-results together
		while ( i1 < r1.size() || i2 < r2.size() ) {
			if ( i1 == r1.size() ) r.push_back ( r2[i2++] ) ;
			else if ( i2 == r2.size() ) r.push_back ( r1[i1++] ) ;
			else if ( r1[i1] < r2[i2] ) r.push_back ( r1[i1++] ) ;
			else if ( r1[i1] > r2[i2] ) r.push_back ( r2[i2++] ) ;
			else { // Same
				r.push_back ( r1[i1] ) ;
				i1++ ;
				i2++ ;
			}
		}
	}
//cout << "MERGED" << endl ;
	
	r1 = r ;
}

template <class T> bool TItemQuery<T>::run ( T *w ) {
	if ( w ) w_ = w ;
	guessMode() ;
	result.clear() ;

	// Run mode
	if ( mode == IQ_SUBQUERIES_AND || mode == IQ_SUBQUERIES_OR ) {
		for ( uint32_t a = 0 ; a < subqueries.size() ; a++ ) subqueries[a].guessMode() ;
		
		for ( uint32_t a = 0 ; a < subqueries.size() ; a++ ) {
//			cout << "SQ " << a << " : " << subqueries[a].mode << endl ;
			if ( subqueries[a].mode == IQ_NO_CLAIM ) {
				if ( a == 0 ) return false ; // Can't be first
				if ( mode != IQ_SUBQUERIES_AND ) return false ; // Needs to be AND
				if ( result.size() == 0 ) return true ; // No point in removing from empty result
			}

			subqueries[a].run ( w_ ) ;
			sort ( subqueries[a].result.begin() , subqueries[a].result.end() ) ;

			if ( subqueries[a].mode == IQ_NO_CLAIM ) {
				
/*				
				vector <TItem> r2 ;
				r2.reserve ( result.size() ) ;
				for ( uint32_t b = 0 ; b < result.size() ; b++ ) {
					if ( !subqueries[a].hadthat.hasItem(result[b]) ) r2.push_back ( result[b] ) ;
				}
				result = r2 ;
*/

				subqueries[a].hadthat.subsetResult ( result , true ) ;
				
				subqueries[a].hadthat.clear() ;
			} else if ( a == 0 ) {
				result.clear() ;
				result.swap ( subqueries[a].result ) ;
			} else {
				mergeResults ( result , subqueries[a].result ) ;
			}

			subqueries[a].result.clear() ;
		}
	} else if ( mode == IQ_HAS_CLAIM ) {
	
	
		for ( uint32_t a = 0 ; a < has_claims.size() ; a++ ) {
			findItemsWithClaim ( has_claims[a] , *w_ , qualifier_query ) ;
		}
		
		hadthat.setResult ( result ) ;
		
	} else if ( mode == IQ_NO_CLAIM ) {
		for ( uint32_t a = 0 ; a < has_claims.size() ; a++ ) {
			findItemsWithClaim ( has_claims[a] , *w_ ) ;
		}
	} else if ( mode == IQ_STRING ) {
		for ( uint32_t a = 0 ; a < has_strings.size() ; a++ ) {
			findItemsWithString ( has_strings[a].first , has_strings[a].second , *w_ , qualifier_query ) ;
		}
		hadthat.setResult ( result ) ;

	} else if ( mode == IQ_BETWEEN ) {

		findItemsBetween ( has_between[0].first.item , has_between[0].second.first , has_between[0].second.second , *w_ , qualifier_query ) ;
		hadthat.setResult ( result ) ;
		
	} else if ( mode == IQ_QUANTITY ) {

		findQuantities ( has_quantity[0].first.item , has_quantity[0].second.first , has_quantity[0].second.second , *w_ , qualifier_query ) ;
		hadthat.setResult ( result ) ;
	
	} else if ( mode == IQ_AROUND ) {

		findItemsAround ( has_around[0] , *w_ , qualifier_query ) ;
		hadthat.setResult ( result ) ;

	} else if ( mode == IQ_ITEMS ) {

		size_t l = has_claims[0].items.size() ;
		result.reserve ( l ) ;
		for ( size_t a = 0 ; a < l ; a++ ) result.push_back ( has_claims[0].items[a] ) ;

	} else if ( mode == IQ_HAS_LINK ) {
	
		for ( uint32_t a = 0 ; a < has_link.size() ; a++ ) {
			w_->findItemsWithLink ( has_link[a] , hadthat ) ;
		}
		hadthat.setResult ( result ) ;

	} else if ( mode == IQ_NO_LINK ) {
	
		w_->findItemsWithoutLink ( has_link , hadthat ) ;
		hadthat.setResult ( result ) ;

	} else if ( mode == IQ_CHAINS ) {
		
		TIntermediateResult hadthat2 ;
		for ( uint32_t a = 0 ; a < root_items.size() ; a++ ) {
			hadthat.clear() ;
			followChains ( root_items[a] , *w_ , true ) ;
			hadthat2.fromIR ( hadthat ) ;
//			for ( map <TItem,bool>::iterator i = hadthat.begin() ; i != hadthat.end() ; i++ ) hadthat2[i->first] = true ;
			hadthat.clear() ;
			followChains ( root_items[a] , *w_ , false ) ;
			hadthat2.fromIR ( hadthat ) ;
//			for ( map <TItem,bool>::iterator i = hadthat.begin() ; i != hadthat.end() ; i++ ) hadthat2[i->first] = true ;
		}
		hadthat2.setResult ( result ) ;

	} else if ( mode == IQ_WEB ) {
		hadthat.clear() ;
		for ( uint32_t a = 0 ; a < root_items.size() ; a++ ) hadthat.addItem(root_items[a]) ;
		followWeb ( hadthat , *w_ ) ;
		hadthat.setResult ( result ) ;

	} else return false ;

	return true ;
}


template <class T> void TItemQuery<T>::followChains ( TItem item , T &w , bool forward ) {
	w.followChains ( item , forward , hadthat , follow_forward , follow_reverse ) ;
}


template <class T> void TItemQuery<T>::followWeb ( TIntermediateResult &had , T &w ) {
	w.followWeb ( had , hadthat , follow_forward , follow_reverse ) ;
}
