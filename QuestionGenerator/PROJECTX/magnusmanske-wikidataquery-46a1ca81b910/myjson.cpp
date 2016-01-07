#include "myjson.h"

char *MyJSON::parse ( char *t , int depth ) {
	if ( *t == 0 ) { cout << "!!!0\n" ; return NULL ;} 
	
	char *c = t ;

	if ( *t == '{' ) {
		isa = MJO ;
		c++ ;
		while ( *c && *c != '}' ) {

			MyJSON k , v ;
			c = k.parse ( c , depth+1 ) ;
			if ( *c == ':' ) c++ ;
			else { cout << "!!!1\n" ; return NULL ;}  // FIXME
			c = v.parse ( c , depth+1 ) ;
			o[k.s] = v ; // FIXME numerical keys etc.
			if ( *c == ',' ) c++ ;
		}
		if ( *c == '}' ) c++ ;
		return c ;
	}

	if ( *t == '[' ) {
		isa = MJA ;
		a.reserve ( 50 ) ;
		c++ ;
		while ( *c && *c != ']' ) {
			a.push_back ( MyJSON() ) ;
			c = a[a.size()-1].parse ( c , depth+1 ) ;
			if ( *c == ',' ) c++ ;
		}
		if ( *c == ']' ) c++ ;
		return c ;
	}
	
	if ( *t == '"' ) { // NOTE: Strings will still be escaped and JSON-encoded, \uXXX etc.
		isa = MJS ;
		for ( c++ ; *c && *c != '"' ; c++ ) {
			if ( *c == '\\' ) c++ ;
		}
		char old = *c ;
		*c = 0 ;
		s = t+1 ;
		if ( old == '"' ) c++ ;
		return c ;
	}
	
	if ( *t == 'n' && *(t+1) == 'u' && *(t+1) == 'u' && *(t+2) == 'l' && *(t+3) == 'l' ) {
		isa = MJN ;
		c += 4 ;
		return c ;
	}
	
	// Number
	isa = MJF ;
	for ( ; *c && *c != ',' && *c != ']' && *c != '}' ; c++ ) ;
	char old = *c ;
	*c = 0 ;
	if ( *t == '+' ) t++ ;
	i = atol ( t ) ;
	f = atof ( t ) ;
	*c = old ;
	return c ;
}

void MyJSON::print ( ostream &out ) {
	bool first = true ;
	switch ( isa ) {
		case MJS : out << "\"" << s << "\"" ; break ;
		case MJI : out << i  ; break ;
		case MJF : out << f  ; break ;
		case MJA :	out << "[" ;
			for ( uint32_t x = 0 ; x < a.size() ; x++ ) {
				if ( !first ) out << "," ;
				a[x].print(out) ;
				first = false ;
			}
			out << "]" ;
			break ;
		case MJO : out << "{" ;
			for ( map <string,MyJSON>::iterator x = o.begin() ; x != o.end() ; x++ ) {
				if ( !first ) out << "," ;
				out << "\"" << x->first << "\":" ;
				x->second.print(out) ;
				first = false ;
			}
			out << "}" ;
			break ;
		case MJN : out << "null" << endl ; break ;
	}
}