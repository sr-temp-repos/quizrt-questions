#include "wd_inmem.h"
#include <mysql/errmsg.h>
#include <sys/time.h>
/*
template <class T> string TStatement<T>::dumpItemData () {
	std::ostringstream ret ;
	if ( qualifiers ) ret << qualifiers->dumpItemData() ;
	return ret.str() ;
}
*/


template <class T> void addStatementOrQualifiers2 ( TPropertyNumber p , T &base , TItem &item , MyJSON *m ) 
{
	MyJSON *mainsnak = m ;
	if ( m->has("mainsnak") ) mainsnak = &(m->get("mainsnak")) ;


	if ( !mainsnak->has("snaktype") ) return ; // Paranoia
	
	MyJSON *qual = NULL ;
	if ( m->has("qualifiers") ) {
		qual = &((*m)["qualifiers"]) ;
	}

	TQualifiers *qs = NULL ;
	if ( qual != NULL ) {
		qs = new TQualifiers ;
		for ( map <string,MyJSON>::iterator a = qual->o.begin() ; a != qual->o.end() ; a++ ) {
			TPropertyNumber p2 = atol ( a->first.c_str()+1 ) ;
			for ( uint32_t b = 0 ; b < a->second.size() ; b++ ) {
				addStatementOrQualifiers2 ( p2 , *qs , item , &(a->second[b]) ) ;
			}
		}
	}
	
	string snaktype = (*mainsnak)["snaktype"].s ;
	if ( snaktype != "value" ) {
		if ( snaktype == "novalue" ) {
			TStatement <TItem> n ( item , NOVALUE , qs ) ;
			base.props.addEntry ( p , n ) ;
		} else if ( snaktype == "somevalue" ) {
			TStatement <TItem> n ( item , SOMEVALUE , qs ) ;
			base.props.addEntry ( p , n ) ;
		} else {
			cerr << "UNKNOWN TYPE " << snaktype << endl ;
		}
		return ;
	}

	if ( !mainsnak->has("datavalue") ) {
		cerr << "!!" << snaktype << endl ;
		return ;
	}

	MyJSON *dv = &(mainsnak->get("datavalue")) ;

	
	string type = (*dv)["type"].s ;
	
	if ( type == "string" ) {
		TStatement <TString> n ( item , TString ((*dv)["value"].s) , qs ) ;
		base.strings.addEntry ( p , n ) ;

	} else if ( type == "wikibase-entityid" ) {
		TItem qb = (*dv)["value"]["numeric-id"].i ;
		TStatement <TItem> n ( item , qb , qs ) ;
		base.props.addEntry ( p , n ) ;

	} else if ( type == "time" ) {
		TTime t ;
		if ( !t.parseString ( (*dv)["value"]["time"].s ) ) { // Bad date!
			if ( qs ) delete qs ;
			return ;
		}
		t.timezone = (*dv)["value"]["timezone"].i ;
		t.before = (*dv)["value"]["before"].i ;
		t.after = (*dv)["value"]["after"].i ;
		t.precision = (*dv)["value"]["precision"].i ;

		char *e ;
		for ( e = (*dv)["value"]["calendarmodel"].s ; *e != 'Q' ; e++ ) ; // Extracting from URL
		t.model = atol((e+1)) ;
		
		TStatement <TTime> n ( item , t , qs ) ;
		base.times.addEntry ( p , n ) ;

	} else if ( type == "globecoordinate" ) {
		TCoordinate coord ;
		coord.latitude = (*dv)["value"]["latitude"].f ;
		coord.longitude = (*dv)["value"]["longitude"].f ;
		coord.altitude = (*dv)["value"]["altitude"].f ;
		coord.has_altitude = 1 ; // TODO
		coord.precision = (*dv)["value"]["precision"].i ;
		
		char *e ;
		for ( e = (*dv)["value"]["globe"].s ; *e != 'Q' ; e++ ) ; // Extracting from URL
		coord.globe = atol((e+1)) ;

		TStatement <TCoordinate> n ( item , coord , qs ) ;
		base.coords.addEntry ( p , n ) ;

	} else if ( type == "quantity" ) {
		TQuantity quant ;
		quant.amount = atof((*dv)["value"]["amount"].s) ;
		quant.lowerBound = atof((*dv)["value"]["lowerBound"].s) ;
		quant.upperBound = atof((*dv)["value"]["upperBound"].s) ;
		quant.unit = atof((*dv)["value"]["unit"].s) ;
		
		TStatement <TQuantity> n ( item , quant , qs ) ;
		base.quantities.addEntry ( p , n ) ;

	} else if ( type == "monolingualtext" ) {
		TMonolingual mono ( (*dv)["value"]["language"].s , (*dv)["value"]["text"].s ) ;

		TStatement <TMonolingual> n ( item , mono , qs ) ;
		base.monolingual.addEntry ( p , n ) ;

	} else {
		cerr << type << endl ;
		
	}

}


template <class T> void addStatementOrQualifiers ( T &base , TItem &item , MyJSON *m , MyJSON *qual ) {
	TPropertyNumber p = (*m)[1].i ;

	string m2 ;
	if ( m->size() > 2 ) m2 = ( (*m)[2].s ) ;
	
	TQualifiers *qs = NULL ;
	if ( qual != NULL ) {
		qs = new TQualifiers ;
		for ( uint32_t x = 0 ; x < qual->size() ; x++ ) {
			addStatementOrQualifiers <TQualifiers> ( *qs , item , &(qual->a[x]) , NULL ) ;
//			qs->addStatementOrQualifiers ( item , &(qual->a[x]) ) ;
		}
	}
	
	if ( m->size() > 2 && m2 == "bad" ) {
		if ( qs ) delete qs ;
		return ;
	} else if ( m->size() > 3 && m2 == "string" ) {
		if ( !*((*m)[2].s) ) return ; // Paranoia
		TStatement <TString> n ( item , TString ((*m)[3].s) , qs ) ;
		base.strings.addEntry ( p , n ) ;
	} else if ( m->size() > 3 && (*m)[3].has("numeric-id") ) {
		TItem qb = (*m)[3]["numeric-id"].i ;
		TStatement <TItem> n ( item , qb , qs ) ;
		base.props.addEntry ( p , n ) ;
	} else if ( m->size() > 3 && m2 == "time" ) {

		TTime t ;
		if ( !t.parseString ( (*m)[3]["time"].s ) ) { // Bad date!
			if ( qs ) delete qs ;
			return ;
		}
		t.timezone = (*m)[3]["timezone"].i ;
		t.before = (*m)[3]["before"].i ;
		t.after = (*m)[3]["after"].i ;
		t.precision = (*m)[3]["precision"].i ;

		char *e ;
		for ( e = (*m)[3]["calendarmodel"].s ; *e != 'Q' ; e++ ) ; // Extracting from URL
		t.model = atol((e+1)) ;
		
		TStatement <TTime> n ( item , t , qs ) ;
		base.times.addEntry ( p , n ) ;

	} else if ( m->size() > 3 && m2 == "globecoordinate" ) {
	
		TCoordinate coord ;
		coord.latitude = (*m)[3]["latitude"].f ;
		coord.longitude = (*m)[3]["longitude"].f ;
		coord.altitude = (*m)[3]["altitude"].f ;
		coord.has_altitude = 1 ; // TODO
		coord.precision = (*m)[3]["precision"].i ;
		
		char *e ;
		for ( e = (*m)[3]["globe"].s ; *e != 'Q' ; e++ ) ; // Extracting from URL
		coord.globe = atol((e+1)) ;

		TStatement <TCoordinate> n ( item , coord , qs ) ;
		base.coords.addEntry ( p , n ) ;
		
		
	} else if ( m->size() > 3 && m2 == "quantity" ) {

		TQuantity quant ;
		quant.amount = atof((*m)[3]["amount"].s) ;
		quant.lowerBound = atof((*m)[3]["lowerBound"].s) ;
		quant.upperBound = atof((*m)[3]["upperBound"].s) ;
		quant.unit = atof((*m)[3]["unit"].s) ;
		
		TStatement <TQuantity> n ( item , quant , qs ) ;
		base.quantities.addEntry ( p , n ) ;

	} else {
	
		string m0 ( (*m)[0].s ) ;
		if ( m0 == "novalue" ) {
			TStatement <TItem> n ( item , NOVALUE , qs ) ;
			base.props.addEntry ( p , n ) ;
		} else if ( m0 == "somevalue" ) {
			TStatement <TItem> n ( item , SOMEVALUE , qs ) ;
			base.props.addEntry ( p , n ) ;
		} else {
			cerr << "UNKNOWN TYPE " << m2 << endl ;
		}
	}
}


template <class T> TStatementList<T>::~TStatementList () {
	if ( no_qualifier_nuke ) return ; // TODO this is ... not elegant
	for ( uint32_t a = 0 ; a < list.size() ; a++ ) {
		for ( uint32_t b = 0 ; b < list[a].size() ; b++ ) {
			list[a][b].deleteQualifiers() ;
		}
	}
}


template <class T> TStatement<T>::TStatement ( TItem new_item , T new_value , TQualifiers *qs ) {
	item = new_item.item ; 
	value = new_value ; 
	qualifiers = qs ; 
	rank = RANK_DEFAULT ; 
	if ( qs ) qs->referenced++ ;
}

template <class T> TStatement<T>::TStatement ( TItemNumber new_item , T new_value , TQualifiers *qs ) {
	item = new_item ;
	value = new_value ;
	qualifiers = qs ;
	rank = RANK_DEFAULT ;
	if ( qs ) qs->referenced++ ;
}

template <class T> void TStatement<T>::setFrom ( TStatement <T> &other ) {
	item = other.item ;
	value = other.value ;
	rank = other.rank ;
	if ( other.qualifiers ) {
		qualifiers = new TQualifiers ;
		*qualifiers = *(other.qualifiers) ;
	} else qualifiers = NULL ;
}

template <class T> TStatement<T>::~TStatement () {
}

template <class T> void TStatement<T>::deleteQualifiers() {
	if ( !qualifiers ) return ;
	qualifiers->referenced-- ;
	if ( qualifiers->referenced > 0 ) return ;
	delete qualifiers ;
//	qualifiers = NULL ;
}

template <class T> void TStatement<T>::writeBinary ( FILE *out ) {
	FWRITE(item);
	value.writeBinary ( out ) ;
	
	uint8_t x = rank ;
	if ( qualifiers != NULL ) x |= HAS_QUALIFIERS ;
	FWRITE(x);
	if ( x&HAS_QUALIFIERS ) qualifiers->writeBinary ( out ) ;
}

template <class T> void TStatement<T>::readBinary ( FILE *in , uint8_t major_version , uint8_t minor_version ) {
	FREAD(item);
	value.readBinary ( in , major_version , minor_version ) ;
	
	if ( major_version < 2 ) return ;
	if ( major_version == 2 && minor_version < 3 ) return ; // >= V2.3
	FREAD(rank);
	if ( rank&HAS_QUALIFIERS ) {
		rank -= HAS_QUALIFIERS ;
		qualifiers = new TQualifiers ;
		qualifiers->readBinary ( in , major_version , minor_version ) ;
	}
}

//________________________________________________________________________________________________


bool itempair_is_greater ( TStatement <TItem> i1 , TStatement <TItem> i2 ) {
	return ( i1.item == i2.item ) ? (( i1.value.isDummy() || i2.value.isDummy() )?false:( i1.value.item > i2.value.item )) : ( i1.item > i2.item ) ;
}

TItemSet::TItemSet () {
	is_ready = true ;
	busy = true ;
	query_count = 0 ;
	props.sorter = itempair_is_greater ;
	rprops.sorter = itempair_is_greater ;
	db = NULL ;
}


//________________________________________________________________________________________________

void split ( char sep , char *s , vector <char *> &vc ) {
	vc.clear() ;
	char *lc = s ;
	for ( char *c = s ; *c ; c++ ) {
		if ( *c == sep ) {
			*c = 0 ;
			vc.push_back ( lc ) ;
			lc = c+1 ;
		}
	}
	if ( *lc ) vc.push_back ( lc ) ;
}

void escapeJsonStringToStringStream(const std::string& input,std::ostringstream &ss) {
//    std::ostringstream ss;
//    for (auto iter = input.cbegin(); iter != input.cend(); iter++) {
    //C++98/03:
    for (std::string::const_iterator iter = input.begin(); iter != input.end(); iter++) {
        switch (*iter) {
            case '\\': ss << "\\\\"; break;
            case '"': ss << "\\\""; break;
            case '/': ss << "\\/"; break;
            case '\b': ss << "\\b"; break;
            case '\f': ss << "\\f"; break;
            case '\n': ss << "\\n"; break;
            case '\r': ss << "\\r"; break;
            case '\t': ss << "\\t"; break;
            default: ss << *iter; break;
        }
    }
//    return ss.str();
}

string escapeJsonStringToStringStream(const std::string& input) {
	std::ostringstream ss ;
	escapeJsonStringToStringStream ( input , ss ) ;
	return ss.str() ;
}

void myReplace(std::string& str, const std::string& oldStr, const std::string& newStr)
{
  size_t pos = 0;
  while((pos = str.find(oldStr, pos)) != std::string::npos)
  {
     str.replace(pos, oldStr.length(), newStr);
     pos += newStr.length();
  }
}

//________________________________________________________________________________________________


/**
	Returns true if parsing went OK. Allows for "short" dates/times.
*/
bool TTime::parseString ( char *s ) {
	// +00000001861-03-17T00:00:00Z
	year = 0 ;
	timezone = before = after = 0 ;
	month = day = hour = minute = second = precision = 0 ;
	model = 0 ;
	is_initialized = true ;
	bool end = false ;
	
	char *d = s ;
	if ( *d == '+' ) d++ ;
	char *ld = d ;
	for ( ; *d && *d != '-' ; d++ ) ;
	if ( !*d ) end = true ;
	*d++ = 0 ; year = atoll ( ld ) ;
	ld = d ;
	if ( end ) return true ;
	for ( d++ ; *d && *d != '-' ; d++ ) ;
	if ( !*d ) end = true ;
	*d++ = 0 ; month = atoi ( ld ) ;
	ld = d ;
	if ( end ) return true ;
	for ( d++ ; *d && *d != 'T' ; d++ ) ;
	if ( !*d ) end = true ;
	*d++ = 0 ; day = atoi ( ld ) ;
	ld = d ;
	if ( end ) return true ;
	for ( d++ ; *d && *d != ':' ; d++ ) ;
	if ( !*d ) end = true ;
	*d++ = 0 ; hour = atoi ( ld ) ;
	ld = d ;
	if ( end ) return true ;
	for ( d++ ; *d && *d != ':' ; d++ ) ;
	if ( !*d ) end = true ;
	*d++ = 0 ; minute = atoi ( ld ) ;
	ld = d ;
	if ( end ) return true ;
	for ( d++ ; *d && *d != 'Z' ; d++ ) ;
	if ( !*d ) end = true ;
	*d++ = 0 ; second = atoi ( ld ) ;
	ld = d ;
	if ( end ) return true ;
	// microseconds???
	return true ;
}

string TTime::toString () {
	if ( !is_initialized ) return "" ;
	char t[100] ; // +00000001861-03-17T00:00:00Z
	sprintf ( t , "%c%011ld-%02d-%02dT%02d:%02d:%02dZ" , (year<0?'-':'+') , (long) abs(year) , month , day , hour , minute , second ) ; // ld or lld?
	return t ;
} ;


//________________________________________________________________________________________________

string TMonolingual::toString () {
	return lang + ":" + text ;
}


//________________________________________________________________________________________________

string TCoordinate::toString () {
	char tmp[1000] ;
	if ( has_altitude ) sprintf ( tmp , "%f|%f|%f|%d" , latitude , longitude , altitude , precision ) ;
	else sprintf ( tmp , "%f|%f||%d" , latitude , longitude , precision ) ;
	return string ( tmp ) ;
}


//________________________________________________________________________________________________

string TQuantity::toString () {
	char tmp[1000] ;
	sprintf ( tmp , "%f|%f|%f|%f" , amount , lowerBound , upperBound , unit ) ;
	return string ( tmp ) ;
}



//________________________________________________________________________________________________

string TItemSet::dumpItemData ( TItem i ) {
	string ret ;
	ret += props.dumpItemData ( i ) ;
	ret += strings.dumpItemData ( i ) ;
	ret += coords.dumpItemData ( i ) ;
	ret += times.dumpItemData ( i ) ;
	ret += quantities.dumpItemData ( i ) ;
	ret += monolingual.dumpItemData ( i ) ;
	return ret ;
}

void TItemSet::clear () {
	props.clear() ;
	rprops.clear() ;
	strings.clear() ;
	times.clear() ;
	quantities.clear() ;
	monolingual.clear() ;
	coords.clear() ;
	links.clear() ;
	labels.clear() ;
	m_item.clear() ;
	m_prop.clear() ;
	update_files.clear() ;
}

//____

void TItemSet::importBinary ( string fn , bool just_time ) {
	FILE *in = fopen(fn.c_str(), "rb");
	importBinary ( in , just_time ) ;
	fclose ( in ) ;
}


void TItemSet::importBinary ( FILE *in , bool just_time ) {
	uint32_t num_props ;
	char buffer[BUFSIZE] ;

	clog << "Reading header from WDQ file" << endl ;
		
	clear() ;

	// Version
	uint8_t major_version = 0 , minor_version = 0 ;
	FREAD(major_version) ;
	
	
	if ( major_version > 2 ) return ; // Version newer than code

	if ( major_version > 1 ) {
		FREAD(minor_version) ;

		char *c ;
		fgets(buffer,BUFSIZE,in) ;
		for ( c = buffer ; *c && *c != '\n' ; c++ ) ;
		*c = 0 ;
		time_start = buffer ;

		fgets(buffer,BUFSIZE,in) ;
		for ( c = buffer ; *c && *c != '\n' ; c++ ) ;
		*c = 0 ;
		time_end = buffer ;
	}

	if ( just_time ) return ;
	
	
	// Parts

	clog << "Reading item links from WDQ file" << endl ;
	props.readBinary ( in , major_version , minor_version ) ;

	clog << "Reading strings from WDQ file" << endl ;
	strings.readBinary ( in , major_version , minor_version ) ;

	clog << "Reading times from WDQ file" << endl ;
	times.readBinary ( in , major_version , minor_version ) ;

	clog << "Reading coordinates from WDQ file" << endl ;
	coords.readBinary ( in , major_version , minor_version ) ;

	// Links
	if ( major_version > 2 || ( major_version == 2 && minor_version > 0 ) ) {
		clog << "Reading sitelinks from WDQ file" << endl ;
		FREAD(num_props) ;
		
		for ( uint32_t a = 0 ; a < num_props ; a++ ) {
		
			fgets(buffer,BUFSIZE,in) ;
			char *c ;
			for ( c = buffer ; *c && *c != '\n' ; c++ ) ;
			*c = 0 ;
			string wiki ( buffer ) ;
			
			uint32_t num_items ;
			fread(&num_items, sizeof(num_items), 1, in);
			links[wiki].resize ( num_items ) ;
			for ( uint32_t b = 0 ; b < num_items ; b++ ) {
				FREAD(links[wiki][b]) ;
			}
			
		}
	}


	if ( major_version > 2 || ( major_version == 2 && minor_version > 1 ) ) {
		clog << "Reading quantities from WDQ file" << endl ;
		quantities.readBinary ( in , major_version , minor_version ) ;
	}
	
	if ( major_version > 2 || ( major_version == 2 && minor_version > 4 ) ) {
		clog << "Reading monolingual strings from WDQ file" << endl ;
		monolingual.readBinary ( in , major_version , minor_version ) ;
	}

	// Labels
	if ( major_version > 2 || ( major_version == 2 && minor_version > 4 ) ) {
		clog << "Reading label data from WDQ file" << endl ;
		FREAD(num_props) ;
		
		for ( uint32_t a = 0 ; a < num_props ; a++ ) {
		
			fgets(buffer,BUFSIZE,in) ;
			char *c ;
			for ( c = buffer ; *c && *c != '\n' ; c++ ) ;
			*c = 0 ;
			string lang ( buffer ) ;
			
			uint32_t num_items ;
			fread(&num_items, sizeof(num_items), 1, in);
			labels[lang].resize ( num_items ) ;
			for ( uint32_t b = 0 ; b < num_items ; b++ ) {
				FREAD(labels[lang][b]) ;
			}
			
		}
	}

	clog << "Reading WDQ file done, generating backlinks" << endl ;
	prepareProps () ;
	clog << "Backlinks generated" << endl ;

	clog << getStatsString() ;
}

void TItemSet::exportBinary ( string fn ) {
	string tmpname = fn + ".tmp" ;
	FILE* out = fopen(tmpname.c_str(), "wb+");
	exportBinary ( out ) ;
	fclose ( out ) ;
	
	if ( remove ( fn.c_str() ) != 0 ) {
		cerr << "Problem deleting " << fn << endl ;
		exit ( 0 ) ; // Paranoia
	}
	if ( rename( tmpname.c_str() , fn.c_str() ) != 0 ) {
		cerr << "Problem moving " << tmpname << " to " << fn << endl ;
		exit ( 0 ) ; // Paranoia
	}
}



void TItemSet::exportBinary ( FILE *out ) {
	char nl = '\n' ;
	
	// Version
	uint8_t major_version = 2 , minor_version = 5 ;
	FWRITE(major_version);
	FWRITE(minor_version) ;

	// Time
	const char *s ;
	s = time_start.c_str() ;
	fwrite(s, sizeof(char), strlen(s), out);
	fwrite(&nl,sizeof(char),1,out);
	s = time_end.c_str() ;
	fwrite(s, sizeof(char), strlen(s), out);
	fwrite(&nl,sizeof(char),1,out);

	// Parts
	props.writeBinary ( out ) ;
	strings.writeBinary ( out ) ;
	times.writeBinary ( out ) ;
	coords.writeBinary ( out ) ;
	
	
	// Links
	uint32_t num_props = links.size() ;
	FWRITE(num_props) ;
	for ( Tmsvi::iterator i = links.begin() ; i != links.end() ; i++ ) {
		const char *s = i->first.c_str() ;
		fwrite(s, sizeof(char), strlen(s), out);
		fwrite(&nl,sizeof(char),1,out);
		uint32_t l = i->second.size() ;
		FWRITE(l) ;
		for ( uint32_t a = 0 ; a < l ; a++ ) {
			FWRITE(i->second[a]) ;
		}
	}
	
	quantities.writeBinary ( out ) ;
	monolingual.writeBinary ( out ) ;

	// Labels
	num_props = labels.size() ;
	FWRITE(num_props) ;
	for ( Tmsvi::iterator i = labels.begin() ; i != labels.end() ; i++ ) {
		const char *s = i->first.c_str() ;
		fwrite(s, sizeof(char), strlen(s), out);
		fwrite(&nl,sizeof(char),1,out);
		uint32_t l = i->second.size() ;
		FWRITE(l) ;
		for ( uint32_t a = 0 ; a < l ; a++ ) {
			FWRITE(i->second[a]) ;
		}
	}
}

TPropertyNumber TItemSet::getMaxProp () {
	TPropertyNumber max = 0 ;
	if ( props.size() > max ) max = props.size() ;
	if ( strings.size() > max ) max = strings.size() ;
	if ( times.size() > max ) max = times.size() ;
	if ( coords.size() > max ) max = coords.size() ;
	return max ;
}


string TItemSet::getLabel ( map <TItem,TLabelPair> &m , TItem i , string lang ) {
	if ( m.find(i) == m.end() ) return "" ;
	if ( m[i].label.find ( lang ) == m[i].label.end() ) return "" ;
	return m[i].label[lang] ;
}


//typedef pair <TItem,TItem> itempair ;
//typedef vector <itempair> Tvsi ;

// TODO this could be more efficient...
void TItemSet::getPropJSONForItems ( TPropertyNumber p , vector <TItem> &items , string &s , bool add_target_items ) {
	char tmp[10000] ;
	map <TItem,bool> targets ;
	
	addOutputStrings ( p , items , s , add_target_items?&targets:NULL ) ;

	if ( !add_target_items ) return ;

	// items is already sorted by addOutputStrings
	std::vector<TItem>::iterator it;
	it = std::unique (items.begin(), items.end());
	items.resize( std::distance(items.begin(),it) );
}

void TItemSet::setBusy ( bool b ) {
	// TODO : When setting to true, wait until all other processes have ended before returning
	busy = b ;
}

void TItemSet::fixRprops () {
	rprops.resize ( props.size() ) ;
	for ( uint32_t p = 0 ; p < props.size() ; p++ ) {
		rprops[p].clear() ;
		rprops[p].reserve ( props[p].size() ) ;
		for ( vector<TStatement<TItem> >::iterator i = props[p].begin() ; i != props[p].end() ; i++ ) {
			rprops[p].push_back ( TStatement<TItem> ( i->value.item , i->item ) ) ;
		}
	}
	rprops.sortAll() ;
}



void TItemSet::mergeItemLists ( vector <TItem> &r1 , vector <TItem> &r2 , vector <TItem> &r ) {
	uint32_t i1 = 0 , i2 = 0 ;
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

long TItemSet::getMicrotime() {
	struct timeval t1;	
	gettimeofday(&t1, NULL);
	long ms1 = ((unsigned long long)t1.tv_sec * 1000000) + t1.tv_usec;
	return ms1 ;
}

/*
void TItemSet::mergeFromUpdateSub ( TItemSet &w ) {

	// This updates from w, assuming it is more up-to-date

	map <TItemNumber,bool> remove ;
	w.props.getAllItems ( remove ) ;
	w.strings.getAllItems ( remove ) ;
	w.coords.getAllItems ( remove ) ;
	w.times.getAllItems ( remove ) ;
	w.quantities.getAllItems ( remove ) ;
	w.monolingual.getAllItems ( remove ) ;
	
	setBusy ( true ) ;
	while ( query_count > 0 ) usleep ( 100 * 1000 ) ; // Wait 0.1sec for queries to end, then try again

	props.updateFrom ( w.props , remove ) ;
	strings.updateFrom ( w.strings , remove ) ;
	coords.updateFrom ( w.coords , remove ) ;
	times.updateFrom ( w.times , remove ) ;
	quantities.updateFrom ( w.quantities , remove ) ;
	monolingual.updateFrom ( w.monolingual , remove ) ;
	
	// Links
	for ( Tmsvi::iterator i = links.begin() ; i != links.end() ; i++ ) links[i->first].size() ;
	for ( Tmsvi::iterator i = w.links.begin() ; i != w.links.end() ; i++ ) links[i->first].size() ;
	for ( Tmsvi::iterator i = links.begin() ; i != links.end() ; i++ ) {
		links[i->first].size() ;
		w.links[i->first].size() ;
		vector <TItem> r ;
		mergeItemLists ( links[i->first] , w.links[i->first] , r ) ;
		r.swap ( links[i->first] ) ;
//		cerr << i->first << " : " << links[i->first].size() << " + " << w.links[i->first].size() << " = " << links[i->first].size() << endl ;
	}

	// Labels
	for ( Tmsvi::iterator i = labels.begin() ; i != labels.end() ; i++ ) labels[i->first].size() ;
	for ( Tmsvi::iterator i = w.labels.begin() ; i != w.labels.end() ; i++ ) labels[i->first].size() ;
	for ( Tmsvi::iterator i = labels.begin() ; i != labels.end() ; i++ ) {
		labels[i->first].size() ;
		w.labels[i->first].size() ;
		vector <TItem> r ;
		mergeItemLists ( labels[i->first] , w.labels[i->first] , r ) ;
		r.swap ( labels[i->first] ) ;
	}
	
	
	if ( !w.time_end.empty() ) time_end = w.time_end ;
	prepareProps() ;
	
	setBusy ( false ) ;
//	cerr << getStatsString() ;
}
*/
void TItemSet::mergeTmsvi ( Tmsvi &target , Tmsvi &l1 , Tmsvi &l2 ) {
	target.clear() ;
	for ( Tmsvi::iterator i = l1.begin() ; i != l1.end() ; i++ ) target[i->first].size() ;
	for ( Tmsvi::iterator i = l2.begin() ; i != l2.end() ; i++ ) target[i->first].size() ;
	
	for ( Tmsvi::iterator i = target.begin() ; i != target.end() ; i++ ) {
		if ( l1.find(i->first) == l1.end() ) { i->second = l2[i->first] ; continue ; }
		if ( l2.find(i->first) == l2.end() ) { i->second = l1[i->first] ; continue ; }
		
		i->second = l1[i->first] ;
		if ( l2[i->first].size() == 0 ) continue ; // Shortcut
		
		i->second.reserve ( l1[i->first].size() + l2[i->first].size() ) ;
		for ( uint32_t p = 0 ; p < l2[i->first].size() ; p++ ) i->second.push_back ( l2[i->first][p] ) ;
		sort ( i->second.begin() , i->second.end() ) ;
		i->second.erase( unique( i->second.begin(), i->second.end() ), i->second.end() );
	}
}

void TItemSet::mergeFromUpdate ( TItemSet &w ) {

//	long t1 = getMicrotime() , t2 ;
	clog << "Begin merging from diff..." << endl ;

	TItemSet new_set ;
	w.prepareProps() ;

	clog << "Getting list of updated items..." << endl ;
	map <TItemNumber,bool> remove ;
	w.props.getAllItems ( remove ) ;
	w.strings.getAllItems ( remove ) ;
	w.coords.getAllItems ( remove ) ;
	w.times.getAllItems ( remove ) ;
	w.quantities.getAllItems ( remove ) ;
	w.monolingual.getAllItems ( remove ) ;
	
	if ( db ) {
		clog << "Getting redirected items from database" << endl ;
		db->getRedirects ( remove ) ;
		clog << "Getting deleted items from database" << endl ;
		db->getDeletedItems ( remove ) ;
		clog << "Database updates done." << endl ;
	}

	if ( !w.time_end.empty() ) {
		new_set.time_end = w.time_end ;
		time_end = w.time_end ;
	}
	
	clog << "Start merge..." << endl ;
	new_set.props.mergeFrom ( props , w.props , remove ) ;
	new_set.strings.mergeFrom ( strings , w.strings , remove ) ;
	new_set.coords.mergeFrom ( coords , w.coords , remove ) ;
	new_set.times.mergeFrom ( times , w.times , remove ) ;
	new_set.quantities.mergeFrom ( quantities , w.quantities , remove ) ;
	new_set.monolingual.mergeFrom ( monolingual , w.monolingual , remove ) ;
	new_set.mergeTmsvi ( new_set.links , links , w.links ) ;
	new_set.mergeTmsvi ( new_set.labels , labels , w.labels ) ;
	new_set.fixRprops() ;
	
	
/*	
	TItemSet new_set ;
	new_set.mergeFromUpdateSub ( *this ) ; // TODO FIXME replace this with a simple "duplicate TItemSet" function
	new_set.mergeFromUpdateSub ( w ) ;
*/
	clog << "Preparing to swap old and new dataset" << endl ;
	setBusy ( true ) ;
	int max = 50 ; // HACK FIXME the query_count doesn't get released properly. This will wait up to 5 sec and continue anyway, assuming all queries are done.
	while ( query_count > 0 ) {
		usleep ( 100 * 1000 ) ; // Wait 0.1sec for queries to end, then try again
		if ( max-- <= 0 ) break ;
	}
	clog << "Swapping old and new dataset" << endl ;
	resetFromItemset ( new_set ) ;
	clog << "Swap complete" << endl ;
	setBusy ( false ) ;
	clog << "Done merging from diff." << endl ;
}

void TItemSet::resetFromItemset ( TItemSet &i ) {
	props.swap ( i.props ) ;
	rprops.swap ( i.rprops ) ;
	strings.swap ( i.strings ) ;
	times.swap ( i.times ) ;
	coords.swap ( i.coords ) ;
	quantities.swap ( i.quantities ) ;
	monolingual.swap ( i.monolingual ) ;
	links.swap ( i.links ) ;
	labels.swap ( i.labels ) ;
	if ( !i.time_end.empty() ) time_end = i.time_end ;
/*
	// Swap database pointer - DEACTIVATED!
	TWikidataDB *tmp = db ;
	db = i.db ;
	i.db = tmp ;
*/
}


bool TItemSet::updateFromFile ( string filename , bool is_binary ) {
	if ( update_files.find(filename) != update_files.end() ) return false ;
	update_files[filename] = true ;

	TItemSet w ;
	
	if ( is_binary ) {
		w.importBinary ( filename ) ;
	} else {
		FILE *file = fopen ( filename.c_str() , "r" ) ;
		w.import_item_connections ( file , false ) ;
		fclose ( file ) ;
	}

	mergeFromUpdate ( w ) ;
	return true ;
}

void TItemSet::import_binary_fofn ( bool reset ) {
	ifstream in ( binary_fofn.c_str() );
	uint32_t row = 0 ;
	string filename ;
	fofn_files.clear() ;
	while ( getline ( in , filename ) ) {
		fofn_files.push_back ( filename ) ;
		if ( reset && row == 0 ) {
			TItemSet tmp ;
			tmp.importBinary ( filename ) ;
			setBusy ( true ) ;
			resetFromItemset ( tmp ) ;
			time_start = tmp.time_start ;
			time_end = tmp.time_end ;
			setBusy ( false ) ;
		} else updateFromFile ( filename , true ) ;
		row++ ;
	}
	in.close() ;
}

void TItemSet::addItemJSON ( char *buffer ) {
	MyJSON j ( buffer ) ;
	
	if ( j.has("entities") ) {
		for ( map <string,MyJSON>::iterator i = j["entities"].o.begin() ; i != j["entities"].o.end() ; i++ ) {
			parseJSON ( j["entities"].o[i->first] ) ;
		}
	} else {
		parseJSON ( j ) ;
	}
}

void TItemSet::parseJSON ( MyJSON &j ) {
	
	// TODO : Badges
	
	if ( !j.has("id") ) return ; // Paranoia
	if ( *(j["id"].s) != 'Q' ) return ; // No properties or themsuch!

	TItem item = atol(j["id"].s+1) ;

	if ( j.has("sitelinks") ) {
		for ( map <string,MyJSON>::iterator i = j["sitelinks"].o.begin() ; i != j["sitelinks"].o.end() ; i++ ) {
			links[i->first].push_back ( item ) ;
		}
	}

	if ( j.has("labels") ) {
		for ( map <string,MyJSON>::iterator i = j["labels"].o.begin() ; i != j["labels"].o.end() ; i++ ) {
			labels[i->first].push_back ( item ) ;
		}
	}

	if ( j.has("claims") ) {
		for ( map <string,MyJSON>::iterator a = j["claims"].o.begin() ; a != j["claims"].o.end() ; a++ ) {
			TPropertyNumber p = atol ( a->first.c_str()+1 ) ;
			for ( uint32_t b = 0 ; b < a->second.size() ; b++ ) {
				addStatementOrQualifiers2 ( p , *this , item , &(a->second[b]) ) ;
			}
		}
	}
}

void TItemSet::import_json_dump ( FILE *file ) {
	char buffer[BUFSIZE] , *c , *d ;
	setBusy ( true ) ;
	while ( query_count > 0 ) usleep ( 100 * 1000 ) ; // Wait 0.1sec for queries to end, then try again

//	uint32_t linecount = 0 ;
//	int countdown = 100 ;
	while ( fgets ( buffer , BUFSIZE , file ) ) {
		if ( !*buffer ) break ; // Paranoia
		
		if ( *buffer != '{' ) continue ;
		for ( c = buffer ; *c ; c++ ) ;
		if ( *(c-1) == ',') *(c-1) = 0 ;

		addItemJSON ( buffer ) ;

//		cout << ++linecount << endl ;
//		if ( --countdown == 0 ) break ;
	}

	prepareProps () ;
	setBusy ( false ) ;
}


void TItemSet::import_xml_dump ( FILE *file , bool initial_import ) {
	char buffer[BUFSIZE] , *c , *d ;
	setBusy ( true ) ;
	while ( query_count > 0 ) usleep ( 100 * 1000 ) ; // Wait 0.1sec for queries to end, then try again

	string model , title , ts , text ;
	TItem item ;
	const TItemNumber empty_item = NOITEM ;

	while ( fgets ( buffer , BUFSIZE , file ) ) {
		if ( !*buffer ) break ; // Paranoia

		for ( c = buffer ; *c == ' ' || *c == 9 ; c++ ) ;
		if ( *c != '<' ) continue ; // Not XML
		
		bool closing = false ;
		if ( *(c+1) == '/' ) {
			c++ ;
			closing = true ;
		}
		
		string tag ;
		for ( c++ ; *c && *c != '>' && *c != ' ' ; c++ ) tag += *c ;
		for ( ; *c && *c != '>' ; c++ ) ; // Skip attributes ;
		if ( !*c ) continue ; // Premature line end
		
		if ( closing && tag == "page" ) {
			if ( text.empty() ) continue ;
			
			
			if ( item != empty_item && model == "wikibase-item" ) { // Items only
				myReplace ( text , "&quot;" , "\"" ) ;
				string tmp = text + " " ;
				MyJSON j ( (char*)text.c_str() ) ;
				
				// TODO : Labels

				if ( j.has("links") ) {
					for ( map <string,MyJSON>::iterator i = j["links"].o.begin() ; i != j["links"].o.end() ; i++ ) {
						links[i->first].push_back ( item ) ;
					}
				}

				if ( j.has("claims") ) {
					for ( uint32_t a = 0 ; a < j["claims"].size() ; a++ ) {

						if ( !j["claims"][a].has("m") ) continue ;
						MyJSON *m = &(j["claims"][a]["m"]) ;
						if ( m->size() < 2 ) continue ;

						MyJSON *qual = NULL ;
						if ( j["claims"][a]["q"].size() > 0 ) qual = &(j["claims"][a]["q"]) ;
						addStatementOrQualifiers ( *this , item , m , qual ) ;
						
					}
				}

				
			}
			
			title.clear() ;
			text.clear() ;
			continue ;
		}

		
		char *content_begin = ++c ;
		char *content_end = NULL ;
		
		for ( ; *c ; c++ ) {
			if ( *c == '<' && *(c+1) == '/' ) content_end = c ; // Last 
		}

		if ( tag == "timestamp" ) {
			*content_end = 0 ;
			string s ( content_begin ) ;
			if ( time_start.empty() || time_start > s ) time_start = s ;
			if ( time_end.empty() || time_end < s ) time_end = s ;
			continue ;
		}

		if ( !content_end ) continue ; // No closing tag
		
		*content_end = 0 ;
		string content = content_begin ;
		
		if ( tag == "model" ) {
			model = content ;
		} else if ( tag == "title" ) {
			title = content ;
			content_begin = strchr(content_begin , 'Q');
			item = content_begin ? atol ( content_begin+1 ) : NOITEM ;
		} else if ( tag == "text" ) {
			text = content ;
		}
		
		
	}

	if ( initial_import ) prepareProps () ;
//	cerr << getStatsString() ;
	setBusy ( false ) ;
}

void TItemSet::import_item_connections ( FILE *file , bool initial_import ) {
	char buffer[BUFSIZE] , *c , *d ;
	setBusy ( true ) ;
	while ( query_count > 0 ) usleep ( 100 * 1000 ) ; // Wait 0.1sec for queries to end, then try again

	vector <char*> vc ;
	vc.reserve ( 10 ) ;
	while ( fgets ( buffer , BUFSIZE , file ) ) {
		if ( !*buffer ) break ; // Paranoia
		for ( c = buffer ; *c != 9 ; c++ ) ;
		*c++ = 0 ;
		
		// Item ID
		TItem qa ;
		bool is_prop = false ;
		if ( *buffer == 'P' ) {
			is_prop = true ;
			qa = atol ( buffer+1 ) ;
		}
		else qa = atol ( buffer ) ;
		
		// Property or label
		for ( d = c ; *c != 9 ; c++ ) ;
		*c++ = 0 ;
		
		if ( *d == 'L' && *(d+1) == ':' ) { // Label
		continue ; // HACK FIXME Don't load labels - too much memory ATM
			d += 2 ;
			string wiki = d ;
			for ( d = c ; *c && *c != 10 && *c != 13 ; c++ ) ;
			*c = 0 ;
			string label = d ;
			if ( is_prop ) m_prop[qa].label[wiki] = label ;
			else m_item[qa].label[wiki] = label ;
			continue ;
		}
		
		uint32_t p = atol ( d ) ;
		
		if ( *c == 'S' ) { // String
			for ( d = c ; *c && *c != 10 && *c != 13 ; c++ ) ;
			*c = 0 ;
			string s = (d+1) ;
			if ( s.empty() ) continue ; // Paranoia
			if ( p >= strings.size() ) strings.resize ( p+1 ) ;
			strings[p].push_back ( TStatement <TString> ( qa , s ) ) ;

		} else if ( *c == 'T' ) { // Time
			split ( '|' , c+2 , vc ) ;
			if ( vc.size() != 6 ) { cerr << buffer << endl ; exit ( 0 ) ; } // Paranoia
			TTime t ;
			if ( !t.parseString ( vc[0] ) ) continue ; // Bad date!
			t.timezone = atoi ( vc[1] ) ;
			t.before = atoi ( vc[2] ) ;
			t.after = atoi ( vc[3] ) ;
			t.precision = atoi ( vc[4] ) ;
			t.model = atol ( vc[5] ) ;
			if ( p >= times.size() ) times.resize ( p+1 ) ;
			times[p].push_back ( TStatement <TTime> ( qa , t ) ) ;

		} else if ( *c == 'C' ) { // Coordinate
			split ( '|' , c+2 , vc ) ;
			if ( vc.size() != 5 ) { cerr << vc[0] << endl ; exit ( 0 ) ; } // Paranoia
			TCoordinate coord ;
			coord.latitude = atof ( vc[0] ) ;
			coord.longitude = atof ( vc[1] ) ;
			coord.altitude = atof ( vc[2] ) ;
			coord.has_altitude = (vc[2][0] != 0) ;
			coord.precision = atoi ( vc[3] ) ;
			coord.globe = atol ( vc[4] ) ;
			if ( p >= coords.size() ) coords.resize ( p+1 ) ;
			coords[p].push_back ( TStatement <TCoordinate> ( qa , coord ) ) ;
			

		} else { // Item connection
			for ( d = c ; *c ; c++ ) ;
			TItem qb = atol ( d ) ;
			if ( p >= props.size() ) props.resize ( p+1 ) ;
			props[p].push_back ( TStatement <TItem> ( qa , qb ) ) ;
		}
	}
	
	if ( initial_import ) prepareProps () ;
	cerr << getStatsString() ;
	setBusy ( false ) ;
}


void TItemSet::prepareProps() {
	strings.sortAll() ;
	times.sortAll() ;
	quantities.sortAll() ;
	monolingual.sortAll() ;
	coords.sortAll() ;
	props.sortAll() ;

	for ( Tmsvi::iterator i = links.begin() ; i != links.end() ; i++ )
		sort ( i->second.begin() , i->second.end() ) ;

	for ( Tmsvi::iterator i = labels.begin() ; i != labels.end() ; i++ )
		sort ( i->second.begin() , i->second.end() ) ;

	fixRprops() ;
}

string TItemSet::getStatsString() {
	std::ostringstream ret ;
	uint32_t total = 0 ;
	ret << strings.getTotalCount() << " strings" << endl ;

	total = 0 ;
	ret << times.getTotalCount() << " times" << endl ;

	ret << coords.getTotalCount() << " coordinates" << endl ;

	total = 0 ;
	for ( uint32_t a = 0 ; a < props.size() ; a++ ) {
		total += props[a].size() ;
	}
	ret << total << " connections" << endl ;

	ret << quantities.getTotalCount() << " quantities" << endl ;
	
	total = 0 ;
	for ( Tmsvi::iterator i = links.begin() ; i != links.end() ; i++ ) {
		total += i->second.size() ;
	}
	ret << total << " sitelinks" << endl ;

	total = 0 ;
	for ( Tmsvi::iterator i = labels.begin() ; i != labels.end() ; i++ ) {
		total += i->second.size() ;
	}
	ret << total << " labels" << endl ;
	
	ret << monolingual.getTotalCount() << " monolingual_strings" << endl ;
	
	ret << "Times : " << time_start << " - " << time_end << endl ;
	return ret.str() ;
}

void TItemSet::writeClaims ( string filename ) {
	ofstream out ( filename.c_str() ) ;
	for ( uint32_t p = 0 ; p < props.size() ; p++ ) {
		for ( Tvsi::iterator i = props[p].begin() ; i != props[p].end() ; i++ ) {
		out << i->item << "\t" << p << "\t" << i->value.item << endl ;
		}
	}
}

Tmsvi TItemSet::getMultipleStrings ( TPropertyNumber p ) {
	Tmsvi ret , tmp ;
	if ( p >= strings.size() ) return ret ; // Out-of-bounds
	
	for ( uint32_t a = 0 ; a < strings[p].size() ; a++ ) {
		tmp[strings[p][a].value.s].push_back ( strings[p][a].item ) ;
	}
	
	for ( Tmsvi::iterator i = tmp.begin() ; i != tmp.end() ; i++ ) {
		if ( i->second.size() == 1 ) continue ;
		
		// Remove potential duplicates
		sort(i->second.begin(), i->second.end());
		std::vector<TItem>::iterator it;
		it = std::unique (i->second.begin(), i->second.end());
		i->second.resize( std::distance(i->second.begin(),it) );
		if ( i->second.size() == 1 ) continue ;

		ret[i->first] = i->second ;
	}
	
	return ret ;
}


Tvsi TItemSet::getMissingPairs ( TPropertyNumber p1 , vector <TPropertyNumber> &pl2 ) {
	Tvsi ret ;
	if ( p1 >= props.size() ) return ret ; // Out-of-bounds
	for ( uint32_t a = 0 ; a < pl2.size() ; a++ ) {
		if ( pl2[a] >= props.size() ) return ret ; // Out-of-bounds
	}
	
	typedef pair <TItemNumber,TItemNumber> itempair ;
	map <itempair,uint32_t> count ;
	for ( uint32_t a = 0 ; a < props[p1].size() ; a++ ) {
		if ( props[p1][a].value.item == NOVALUE || props[p1][a].value.item == SOMEVALUE ) continue ;
		count[itempair(props[p1][a].item,props[p1][a].value.item)] = 0 ;
	}

	for ( vector <TPropertyNumber>::iterator p2 = pl2.begin() ; p2 != pl2.end() ; p2++ ) {
		for ( vector < TStatement <TItem> >::iterator ii = props[*p2].begin() ; ii != props[*p2].end() ; ii++ ) {
			itempair ip (ii->value.item,ii->item) ;
			if ( count.find(ip) != count.end() ) count[ip]++ ;
		}
	}
	
	ret.reserve ( count.size() ) ;
	for ( map<itempair,uint32_t>::iterator i = count.begin() ; i != count.end() ; i++ ) {
		if ( i->second > 0 ) continue ;
		TStatement <TItem> tmp ;
		tmp.item = i->first.first ;
		tmp.value.item = i->first.second ;
		ret.push_back ( tmp ) ;
	}
	
	return ret ;
}



void TItemSet::findItemsWithoutLink ( vector <string> &has_link , TIntermediateResult &hadthat ) {
	for ( Tmsvi::iterator i = links.begin() ; i != links.end() ; i++ ) {
		bool found = false ;
		for ( uint32_t a = 0 ; a < has_link.size() && !found ; a++ ) {
			if ( has_link[a] == i->first ) found = true ;
		}
		if ( found ) continue ;
		findItemsWithLink ( i->first , hadthat ) ; // No such project registered; thus, all of these are NOLINK...
	}
	
	for ( uint32_t a = 0 ; a < has_link.size() ; a++ ) {
		findItemsWithLink ( has_link[a] , hadthat , true ) ;
	}
}

void TItemSet::findItemsWithLink ( string project , TIntermediateResult &hadthat , bool remove ) {
	if ( links.find(project) == links.end() ) return ;
	
	for ( uint32_t b = 0 ; b < links[project].size() ; b++ ) {
		if ( remove ) {
			if ( hadthat.hasItem(links[project][b]) ) hadthat.removeItem(links[project][b]) ;
		} else {
			hadthat.addItem(links[project][b]) ;
		}
	}

}


void TItemSet::findItemsWithoutLabel ( vector <string> &has_label , TIntermediateResult &hadthat ) {
	for ( Tmsvi::iterator i = labels.begin() ; i != labels.end() ; i++ ) {
		bool found = false ;
		for ( uint32_t a = 0 ; a < has_label.size() && !found ; a++ ) {
			if ( has_label[a] == i->first ) found = true ;
		}
		if ( found ) continue ;
		findItemsWithLabel ( i->first , hadthat ) ;
	}
	
	for ( uint32_t a = 0 ; a < has_label.size() ; a++ ) {
		findItemsWithLabel ( has_label[a] , hadthat , true ) ;
	}
}

void TItemSet::findItemsWithLabel ( string project , TIntermediateResult &hadthat , bool remove ) {
	if ( labels.find(project) == labels.end() ) return ;
	for ( uint32_t b = 0 ; b < labels[project].size() ; b++ ) {
		if ( remove ) {
			if ( hadthat.hasItem(labels[project][b]) ) hadthat.removeItem(labels[project][b]) ;
		} else hadthat.addItem(labels[project][b]) ;
	}
}



void TItemSet::followChains ( TItem &item , bool forward , TIntermediateResult &hadthat , vector <TPropertyNumber> &follow_forward , vector <TPropertyNumber> &follow_reverse ) {
	map <TItem,bool> last , next ;
	
	// Init
	last[item] = true ;
	
	// Iterate
	while ( last.size() > 0 ) {
		for ( map <TItem,bool>::iterator i = last.begin() ; i != last.end() ; i++ ) {
			if ( i->first.item != NOVALUE && i->first.item != SOMEVALUE ) {
				hadthat.addItem(i->first) ;
			}
		}
		next.clear() ;
		
		if ( forward ) {
			for ( uint32_t pid = 0 ; pid < follow_forward.size() ; pid++ ) {
				TPropertyNumber p = follow_forward[pid] ;
				if ( p >= props.size() ) continue ; // Out-of-bounds
				for ( map <TItem,bool>::iterator i = last.begin() ; i != last.end() ; i++ ) {
					TStatement <TItem> lookup ( i->first , TItem(0) ) ;
					props.markEqualRange ( p , lookup , hadthat , next ) ;
				}
			}
		} else {
			for ( uint32_t pid = 0 ; pid < follow_reverse.size() ; pid++ ) {
				TPropertyNumber p = follow_reverse[pid] ;
				if ( p >= rprops.size() ) continue ; // Out-of-bounds
				for ( map <TItem,bool>::iterator i = last.begin() ; i != last.end() ; i++ ) {
					TStatement <TItem> lookup ( i->first , TItem(0) ) ;
					rprops.markEqualRange ( p , lookup , hadthat , next ) ;
				}
			}
		}

		last = next ;
	}

}

	
void TItemSet::followWeb ( TIntermediateResult &had , TIntermediateResult &hadthat , vector <TPropertyNumber> &follow_forward , vector <TPropertyNumber> &follow_reverse ) {
	map <TItem,bool> last , next ;
	
	// Init
	had.setMap ( last ) ;
//	for ( map <TItem,bool>::iterator i = had.begin() ; i != had.end() ; i++ ) last[i->first] = true ;
	
	// Iterate
	while ( last.size() > 0 ) {
		for ( map <TItem,bool>::iterator i = last.begin() ; i != last.end() ; i++ ) {
			if ( i->first.item != NOVALUE && i->first.item != SOMEVALUE ) hadthat.addItem(i->first) ;
		}
		next.clear() ;
		
		for ( uint32_t pid = 0 ; pid < follow_forward.size() ; pid++ ) {
			TPropertyNumber p = follow_forward[pid] ;
			if ( p >= props.size() ) continue ; // Out-of-bounds
			for ( map <TItem,bool>::iterator i = last.begin() ; i != last.end() ; i++ ) {
				TStatement <TItem> lookup ( i->first , TItem(0) ) ;
				props.markEqualRange ( p , lookup , hadthat , next ) ;
			}
		}

		for ( uint32_t pid = 0 ; pid < follow_forward.size() ; pid++ ) {
			TPropertyNumber p = follow_forward[pid] ;
			if ( p >= rprops.size() ) continue ; // Out-of-bounds
			for ( map <TItem,bool>::iterator i = last.begin() ; i != last.end() ; i++ ) {
				TStatement <TItem> lookup ( i->first , TItem(0) ) ;
				rprops.markEqualRange ( p , lookup , hadthat , next ) ;
			}
		}
		
		last = next ;
	}
}

void TItemSet::removeItems ( vector <TItemNumber> &items ) {
	props.removeItems ( items ) ;
	strings.removeItems ( items ) ;
	coords.removeItems ( items ) ;
	times.removeItems ( items ) ;
	quantities.removeItems ( items ) ;
	monolingual.removeItems ( items ) ;
	vector <TItem> items2 ;
	for ( uint32_t a = 0 ; a < items.size() ; a++ ) items2.push_back ( TItem ( items[a] ) ) ;
	props.removeValues ( items2 ) ;
	fixRprops() ;
}


//________________________________________________________________________________________________



TWikidataDB::TWikidataDB ( string config_file , string host ) {
	_database = "wikidatawiki_p" ;
	batch_size = 1000 ;
	curl_global_init(CURL_GLOBAL_ALL);
	_host = host ;
	_config_file = config_file ;
	doConnect(true) ;
}	

void TWikidataDB::doConnect ( bool first ) {	
	if ( !first ) {
		int i = mysql_ping ( &mysql ) ;
		if ( i == 0 ) return ; // Connection is already up
/*		if ( i != CR_SERVER_GONE_ERROR ) {
			cerr << "MySQL PING says: " << i << endl ;
			exit ( 0 ) ;
		}*/
	}
	
	string user , password ;
	char buf[10000] ;
	FILE *fp = fopen(_config_file.c_str(),"r");
	if ( !fp ) finishWithError ( "Cannot open config file" ) ;
	while (fgets(buf, sizeof buf, fp) != NULL) {
		char *c ;
		for ( c = buf ; *c && *c != '=' ; c++ ) ;
		if ( !*c ) continue ;
		*c++ = 0 ;
		string key = buf ;
		if ( key != "user" && key != "password" ) continue ;
		char *value = ++c ;
		for ( c++ ; *c && *c != 39 ; c++ ) ;
		*c = 0 ;
		if ( key == "user" ) user = value ;
		if ( key == "password" ) password = value ;
	}
	fclose(fp);
	if ( user.empty() || password.empty() ) finishWithError ( "User or password missing from config file" ) ;
	
	mysql_init(&mysql);
	mysql_real_connect(&mysql,_host.c_str(),user.c_str(),password.c_str(),_database.c_str(),0,NULL,0) ;
//	printf("MySQL Server Version is %s\n",mysql_get_server_info(&mysql));
}

TWikidataDB::~TWikidataDB () {
   mysql_close(&mysql);
   curl_global_cleanup();
}

void TWikidataDB::runQuery ( string sql ) {
	doConnect() ;
	if ( mysql_query ( &mysql , sql.c_str() ) ) finishWithError() ;
}

MYSQL_RES *TWikidataDB::getQueryResults ( string sql ) {
	runQuery ( sql ) ;
	MYSQL_RES *result = mysql_store_result(&mysql);
	if ( result == NULL ) finishWithError(sql+": No result") ;
	return result ;
}

void TWikidataDB::finishWithError ( string msg ) {
	if ( msg.empty() ) fprintf(stderr, "%s\n", mysql_error(&mysql));
	else fprintf(stderr, "%s\n", msg.c_str());
	mysql_close(&mysql);
	exit(1);        
}

char *TWikidataDB::getTextFromURL ( string url ) {
	char *ret = NULL ;
	CURL *curl;
	curl = curl_easy_init();
	if ( !curl ) return ret ; //finishWithError ( "Could not easy_init CURL for " + url ) ;

	struct MemoryStruct chunk;
	chunk.memory = (char*) malloc(1);  /* will be grown as needed by the realloc above */ 
	chunk.size = 0;    /* no data at this point */ 

	curl_easy_setopt(curl, CURLOPT_URL, url.c_str());
	curl_easy_setopt(curl, CURLOPT_FOLLOWLOCATION, 1L); // Follow redirect; paranoia
	curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, WriteMemoryCallback);
	curl_easy_setopt(curl, CURLOPT_WRITEDATA, (void *)&chunk);
	curl_easy_setopt(curl, CURLOPT_USE_SSL, CURLUSESSL_TRY);
	curl_easy_setopt(curl, CURLOPT_USERAGENT, "wdq-agent/1.0"); // fake agent
	
	CURLcode res = curl_easy_perform(curl);
	if (res != CURLE_OK) {
		fprintf(stderr, "curl_easy_perform() failed for %s: %s\n", url.c_str() , curl_easy_strerror(res));
		return ret ;
//		finishWithError ( "Retrieval error for " + url ) ;
	}
	
	if ( chunk.size == 0 || !chunk.memory ) return ret ; //finishWithError ( "Zero data return for " + url ) ;
	ret = chunk.memory ;
//	if(chunk.memory) free(chunk.memory);
	curl_easy_cleanup(curl);
	return ret ;
}

bool TWikidataDB::updateRecentChanges ( TItemSet &target ) {
	string last_change_time = target.time_end ;
	string timestamp ; 
	for ( uint32_t a = 0 ; a < last_change_time.length() ; a++ ) {
		if ( last_change_time[a] >= '0' && last_change_time[a] <= '9' ) timestamp += last_change_time[a] ;
	}
	
	char sql[10000] ;
	map <TItemNumber,bool> items ;
	while ( 1 ) {
		sprintf ( sql , "select page_title,rev_timestamp from revision,page where page_id=rev_page and page_namespace=0 and rev_timestamp>='%s' order by rev_timestamp asc limit %d" , timestamp.c_str() , batch_size ) ;
		MYSQL_RES *result = getQueryResults ( sql ) ;
		int num_fields = mysql_num_fields(result);
		MYSQL_ROW row;
		uint32_t cnt = 0 ;
		while ((row = mysql_fetch_row(result))) {
			timestamp = row[1] ;
			items[atol(row[0]+1)] = true ;
			if ( items.size() >= batch_size ) break ;
			cnt++ ;
		}
		mysql_free_result(result);
		if ( cnt < batch_size ) break ;
		if ( items.size() >= batch_size ) break ;
	}
	cout << "Found " << items.size() << " items with change.\n" ;
	
	uint64_t cnt = 0 ;
	vector <string> itemcache ;
	TItemSet new_set ;
	for ( map <TItemNumber,bool>::iterator a = items.begin() ; a != items.end() ; a++ ) {
		cnt++ ;
		char item[100] ;
		sprintf ( item , "Q%d" , a->first ) ;
		itemcache.push_back ( item ) ;
		if ( itemcache.size() < 50 ) continue ;
		
		string url = "https://www.wikidata.org/w/api.php?action=wbgetentities&ids=" ;
		for ( int b = 0 ; b < itemcache.size() ; b++ ) {
			if ( b > 0 ) url += "|" ;
			url += itemcache[b] ;
		}
		itemcache.clear() ;
		url += "&format=json" ;
		char *json = getTextFromURL ( url ) ;
		if ( !json ) {
			cerr << "No JSON for " << url << endl ; // Can't be helped, maybe next update...
			continue ;
		}
		new_set.addItemJSON ( json ) ;
		free ( json ) ;
	}

	if ( itemcache.size() > 0 ) {
		string url = "https://www.wikidata.org/w/api.php?action=wbgetentities&ids=" ;
		for ( int b = 0 ; b < itemcache.size() ; b++ ) {
			if ( b > 0 ) url += "|" ;
			url += itemcache[b] ;
		}
		itemcache.clear() ;
		url += "&format=json" ;
		char *json = getTextFromURL ( url ) ;
		if ( !json ) {
			cerr << "No JSON for " << url << endl ; // Can't be helped, maybe next update...
		}
		new_set.addItemJSON ( json ) ;
		free ( json ) ;
	}

//	new_set.prepareProps () ;
	new_set.time_end = timestamp.substr(0,4)+"-"+timestamp.substr(4,2)+"-"+timestamp.substr(6,2)+"T"+timestamp.substr(8,2)+":"+timestamp.substr(10,2)+":"+timestamp.substr(12,2)+"Z" ;
	
//	cout << "\n\n" << new_set.getStatsString() << "\n---\n\n" ;
	
	target.mergeFromUpdate ( new_set ) ;

	return items.size() >= batch_size ; // Might there be more?
}


void TWikidataDB::getRedirects ( map <TItemNumber,bool> &remove ) {
	char sql[10000] ;
	sprintf ( sql , "select epp_entity_id FROM wb_entity_per_page,page WHERE page_id=epp_page_id  AND page_is_redirect=1" ) ;
	MYSQL_RES *result = getQueryResults ( sql ) ;
	int num_fields = mysql_num_fields(result);
	MYSQL_ROW row;
	while ((row = mysql_fetch_row(result))) {
		long q = atol ( row[0] ) ;
		remove[q] = true ;
	}
	mysql_free_result(result);
}

void TWikidataDB::getDeletedItems ( map <TItemNumber,bool> &remove ) {
	char sql[10000] ;
	sprintf ( sql , "select distinct(replace(log_title,'Q','')) from logging where log_action='delete' and log_timestamp>=replace(curdate() - interval 7 day,'-','') and log_namespace=0" ) ;
	MYSQL_RES *result = getQueryResults ( sql ) ;
	int num_fields = mysql_num_fields(result);
	MYSQL_ROW row;
	while ((row = mysql_fetch_row(result))) {
		long q = atol ( row[0] ) ;
		remove[q] = true ;
	}
	mysql_free_result(result);
}
