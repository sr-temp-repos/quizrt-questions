#ifndef __WD_INMEM_H__
#define __WD_INMEM_H__

#include <string.h>
#include <stdint.h>
#include <stdlib.h>
#include <sys/stat.h>
#include <sys/param.h>
#include <sys/time.h>
#include <unistd.h>
#include <stdio.h>
#include <math.h>
#include <string>
#include <vector>
#include <list>
#include <map>
#include <iostream>
#include <fstream>
#include <sstream>
#include <algorithm>
#include "myjson.h"
#include <curl/curl.h>
#include "mysql/mysql.h"

using namespace std ;


// DEFINEs

#ifndef PI
#define PI (3.141592653589793)
#endif
#define DEG2RAD(deg_) ((deg_)*PI/180.0)

// Buffer size 50MB; had a JSON line with 1.2MB, so better take no chances anymore!
#define BUFSIZE 5000000
#define NOITEM 0
#define NOVALUE 4294967295
#define SOMEVALUE 4294967294

#define RANK_PREFERRED 1
#define RANK_DEFAULT 2
#define RANK_DEPRECATED 3

#define HAS_QUALIFIERS 128

#define QUALIFIER_DUMMY_ITEM 1

#define NO_ITEM 0

#define IQ_UNKNOWN 0
#define IQ_CHAINS 1
#define IQ_SUBQUERIES_AND 2
#define IQ_SUBQUERIES_OR 3
#define IQ_HAS_CLAIM 4
#define IQ_NO_CLAIM 5
#define IQ_STRING 6
#define IQ_BETWEEN 7
#define IQ_AROUND 8
#define IQ_HAS_LINK 9
#define IQ_NO_LINK 10
#define IQ_WEB 11
#define IQ_QUANTITY 12
#define IQ_ITEMS 13

#define FREAD(__w__) fread(&__w__, sizeof(__w__), 1, in);
#define FWRITE(__w__) fwrite(&__w__, sizeof(__w__), 1, out)

#define PART_LESS_THAN(PART) if ( t1.PART != t2.PART ) return t1.PART < t2.PART ;

// MAIN TYPEDEFS
typedef uint32_t TItemNumber ;
typedef uint16_t TPropertyNumber ;

string escapeJsonStringToStringStream(const std::string& input) ;


// TBASE AND SUBCLASSES

class TCoordinate ;

class TBase {
public:
} ;


class TItem : public TBase {
public:
	TItem() : item(NOITEM) {}
	TItem ( TItemNumber new_item ) : item(new_item) {}
	TItem(const TItem& obj) : item(obj.item) {}

	string getOutputString(TItemNumber base_item) {
		char tmp[1000] ;
		sprintf ( tmp , "[%d,\"item\",%d]" , base_item , item ) ;
		return string ( tmp ) ;
	}
	
	void writeBinary ( FILE *out ) {
		FWRITE(item);
	}
	
	void readBinary ( FILE *in , uint8_t major_version , uint8_t minor_version ) {
		FREAD(item);
	}
	
	friend ostream& operator <<(ostream &os,const TItem &obj) { os << obj.item ; return os ; }
	TItemNumber item ;
	bool isDummy() { return item == 0 ; }
	string toString () {
		std::ostringstream ret ;
		ret << item ;
		return ret.str() ;
	}

	inline bool isAround ( TCoordinate &coord , float radius ) { return false ; } // Dummy for TCoordinate
	inline const char* type() { return "item" ; }
} ;

class TQuantity : public TBase {
public:

	TQuantity () {}
	TQuantity ( float value ) : amount(value),lowerBound(value),upperBound(value) {}

	string getOutputString(TItemNumber base_item) {
		char tmp[1000] ;
		sprintf ( tmp , "[%d,\"quantity\",\"%s\"]" , base_item , escapeJsonStringToStringStream(toString()).c_str() ) ;
		return string ( tmp ) ;
	}
	
	void writeBinary ( FILE *out ) {
		FWRITE(amount) ;
		FWRITE(lowerBound) ;
		FWRITE(upperBound) ;
		FWRITE(unit) ;
	}
	
	void readBinary ( FILE *in , uint8_t major_version , uint8_t minor_version ) {
		FREAD ( amount ) ;
		FREAD ( lowerBound ) ;
		FREAD ( upperBound ) ;
		FREAD ( unit ) ;
	}

	float amount , lowerBound , upperBound , unit ;
	string toString () ;
	inline bool isAround ( TCoordinate &coord , float radius ) { return false ; } // Dummy for TCoordinate
	inline const char* type() { return "quantity" ; }
} ;

class TMonolingual : public TBase {
public:

	TMonolingual () {}
	TMonolingual ( string _lang , string _text ) : lang(_lang),text(_text) {}

	string getOutputString(TItemNumber base_item) {
		char tmp[1000] ;
		sprintf ( tmp , "[%d,\"quantity\",\"%s\"]" , base_item , escapeJsonStringToStringStream(toString()).c_str() ) ;
		return string ( tmp ) ;
	}

	void writeBinary ( FILE *out ) {
		char nl = '\n' ;
		fwrite(lang.c_str(), sizeof(char), strlen(lang.c_str()), out);
		FWRITE(nl);
		fwrite(text.c_str(), sizeof(char), strlen(text.c_str()), out);
		FWRITE(nl);
	}
	
	void readBinary ( FILE *in , uint8_t major_version , uint8_t minor_version ) {
		char *line = NULL;
		size_t len = 0;
		ssize_t read = 0 ;
		read = getline(&line, &len, in) ;
		if ( read > 0 ) {
			line[read-1] = 0 ;
			lang = line ;
		}
		free(line);
		line = NULL ;
		read = getline(&line, &len, in) ;
		if ( read > 0 ) {
			line[read-1] = 0 ;
			text = line ;
		}
		free(line);
	}
	
	string lang , text ;
	string toString () ;
	inline bool isAround ( TCoordinate &coord , float radius ) { return false ; } // Dummy for TCoordinate
	inline const char* type() { return "monolingual_string" ; }
} ;


class TTime : public TBase {
public:
	TTime() : is_initialized(false) {}

	string getOutputString(TItemNumber base_item) {
		char tmp[1000] ;
		sprintf ( tmp , "[%d,\"time\",\"%s\"]" , base_item , escapeJsonStringToStringStream(toString()).c_str() ) ;
		return string ( tmp ) ;
	}
	
	void writeBinary ( FILE *out ) {
		FWRITE(year) ;
		FWRITE(timezone) ;
		FWRITE(before) ;
		FWRITE(after) ;
		FWRITE(month) ;
		FWRITE(day) ;
		FWRITE(hour) ;
		FWRITE(minute) ;
		FWRITE(second) ;
		FWRITE(precision) ;
		FWRITE(model) ;
	}
	
	void readBinary ( FILE *in , uint8_t major_version , uint8_t minor_version ) {
		is_initialized = true ;
		FREAD ( year ) ;
		FREAD ( timezone ) ;
		FREAD ( before ) ;
		FREAD ( after ) ;
		FREAD ( month ) ;
		FREAD ( day ) ;
		FREAD ( hour ) ;
		FREAD ( minute ) ;
		FREAD ( second ) ;
		FREAD ( precision ) ;
		FREAD ( model ) ;
	}

	int64_t year ;
	int16_t timezone , before , after ;
	int8_t month , day , hour , minute , second , precision ;
	TItem model ;
	bool is_initialized ;

	bool parseString ( char *s ) ;
	string toString () ;
	inline bool isAround ( TCoordinate &coord , float radius ) { return false ; } // Dummy for TCoordinate
	inline const char* type() { return "time" ; }
} ;

class TCoordinate : public TBase {
public:
	TItem globe ;
	float latitude , longitude , altitude ;
	int8_t precision ;
	bool has_altitude ;

	string getOutputString(TItemNumber base_item) {
		char tmp[1000] ;
		sprintf ( tmp , "[%d,\"coord\",\"%s\"]" , base_item , escapeJsonStringToStringStream(toString()).c_str() ) ;
		return string ( tmp ) ;
	}
	
	void writeBinary ( FILE *out ) {
		FWRITE(globe) ;
		FWRITE(latitude) ;
		FWRITE(longitude) ;
		FWRITE(altitude) ;
		FWRITE(precision) ;
		FWRITE(has_altitude) ;
	}
	
	void readBinary ( FILE *in , uint8_t major_version , uint8_t minor_version ) {
		FREAD(globe) ;
		FREAD(latitude) ;
		FREAD(longitude) ;
		FREAD(altitude) ;
		FREAD(precision) ;
		FREAD(has_altitude) ;
	}

	inline double distance ( TCoordinate &other ) {
		double lat1=other.latitude , lon1=other.longitude ;
		double lat2=latitude , lon2=longitude ;
		
		double R = 6371; // km
		double dLat = DEG2RAD(lat2-lat1);
		double dLon = DEG2RAD(lon2-lon1);
		lat1 = DEG2RAD(lat1);
		lat2 = DEG2RAD(lat2);

		double a_ = sin(dLat/2.0) * sin(dLat/2.0) + sin(dLon/2.0) * sin(dLon/2.0) * cos(lat1) * cos(lat2); 
		double c_ = 2.0 * atan2(sqrt(a_), sqrt(1-a_)); 
		return R * c_;
	}

	inline bool isAround ( TCoordinate &coord , float radius ) {
		return distance(coord) < radius ;
	}
	
	string toString () ;
	inline const char* type() { return "coordinate" ; }
} ;

class TString : public TBase {
public:
	TString () {}
	TString ( string new_string ) : s(new_string) {}
	
	string getOutputString(TItemNumber base_item) {
		char tmp[1000] ;
		sprintf ( tmp , "[%d,\"string\",\"%s\"]" , base_item , toString().c_str() ) ;
		return string ( tmp ) ;
	}
	
	void writeBinary ( FILE *out ) {
		char nl = '\n' ;
		fwrite(s.c_str(), sizeof(char), strlen(s.c_str()), out);
		FWRITE(nl);
	}
	
	void readBinary ( FILE *in , uint8_t major_version , uint8_t minor_version ) {
		char *line = NULL;
		size_t len = 0;
		ssize_t read = 0 ;
		read = getline(&line, &len, in) ;
		if ( read > 0 ) {
			line[read-1] = 0 ;
			s = line ;
		}
		free(line);
	}

	string s ;
	string toString() { return s ; }
	inline bool isAround ( TCoordinate &coord , float radius ) { return false ; } // Dummy for TCoordinate
	inline const char* type() { return "string" ; }
} ;


// SORTING OPERATORS

inline bool operator < ( const TQuantity &t1 , const TQuantity &t2 ) {
	PART_LESS_THAN(lowerBound);
	PART_LESS_THAN(upperBound);
	return false ;
}

inline bool operator < ( const TTime &t1 , const TTime &t2 ) {
	PART_LESS_THAN(year);
	PART_LESS_THAN(month);
	PART_LESS_THAN(day);
	PART_LESS_THAN(hour);
	PART_LESS_THAN(minute);
	PART_LESS_THAN(second);
	return false ;
}

inline bool operator < ( const TCoordinate &t1 , const TCoordinate &t2 ) {
	PART_LESS_THAN(latitude);
	PART_LESS_THAN(longitude);
	return false ;
}

inline bool operator < ( const TString &t1 , const TString &t2 ) {
	return t1.s < t2.s ;
}

inline bool operator < ( const TItem &i1 , const TItem &i2 ) {
	return ( i1.item==0 || i2.item==0 )?false:( i1.item < i2.item ) ;
}

inline bool operator < ( const TMonolingual &t1 , const TMonolingual &t2 ) {
	PART_LESS_THAN(lang);
	PART_LESS_THAN(text);
	return false ;
}


inline bool operator == ( const TQuantity &t1 , const TQuantity &t2 ) { return !((t1<t2)||(t2<t1)) ; }
inline bool operator == ( const TTime &t1 , const TTime &t2 ) { return !((t1<t2)||(t2<t1)) ; }
inline bool operator == ( const TCoordinate &t1 , const TCoordinate &t2 ) { return !((t1<t2)||(t2<t1)) ; }
inline bool operator == ( const TString &t1 , const TString &t2 ) { return !((t1<t2)||(t2<t1)) ; }
inline bool operator == ( const TItem &t1 , const TItem &t2 ) { return !((t1<t2)||(t2<t1)) ; }
inline bool operator == ( const TMonolingual &t1 , const TMonolingual &t2 ) { return !((t1<t2)||(t2<t1)) ; }

inline bool operator > ( const TItem &t1 , const TItem &t2 ) { return t2<t1 ; }

inline bool operator != ( const TItem &t1 , const TItemNumber t2 ) { return t1.item != t2 ; }

// END TBASE


// MISC BEGIN

#define IR_MAP 1
#define IR_VECTOR 2

typedef TItemNumber TIntermediateResultType ;

class TIntermediateResult {
public:
	TIntermediateResult () { mode = IR_VECTOR ; vector_is_sorted = true ; }
	inline void addItem ( TIntermediateResultType i ) {
		if ( mode == IR_MAP ) item_map[i] = true ;
		else {
			if ( vector_is_sorted && !item_vector.empty() ) {
				if ( item_vector[item_vector.size()-1] == i ) return ; // Had that; enforcing uniqueness
				if ( item_vector[item_vector.size()-1] > i ) vector_is_sorted = false ;
			}
			item_vector.push_back(i) ;
		}
	}
	inline void addItem ( TItem i ) { addItem ( i.item ) ; }
	inline bool hasItem ( TIntermediateResultType i ) {
		if ( mode == IR_VECTOR && vector_is_sorted ) {
			return std::binary_search (item_vector.begin(), item_vector.end(), i) ;
		} else {
			setMode ( IR_MAP ) ;
			return item_map.find(i) != item_map.end() ;
		}
	}
	inline bool hasItem ( TItem i ) { return hasItem(i.item) ; }
	inline void clear() {
		if ( mode == IR_MAP ) item_map.clear() ;
		else item_vector.clear() ;
	}
	inline int32_t size () {
		if ( mode == IR_MAP ) return item_map.size() ;
		return item_vector.size() ;
	}
	inline void removeItem ( TIntermediateResultType i ) {
		setMode ( IR_MAP ) ;
		item_map.erase ( item_map.find(i) ) ;
	}
	inline void removeItem ( TItem i ) { removeItem ( i.item ) ; }
	void setResult ( vector <TItem> &result , bool do_clear = true ) {
		if ( mode == IR_MAP ) {
			result.reserve ( result.size() + size() ) ;
			for ( map <TIntermediateResultType,bool>::iterator i = item_map.begin() ; i != item_map.end() ; i++ ) result.push_back ( TItem(i->first) ) ;
		} else {
			if ( !do_clear ) cerr << "setResult/vector without clearing!\n" ;
			sortUniq() ;
			result.reserve ( item_vector.size() ) ;
			for ( uint32_t a = 0 ; a < item_vector.size() ; a++ ) result.push_back ( TItem(item_vector[a]) ) ;
//			result.swap ( item_vector ) ;
//			item_vector.clear() ;
		}
		if ( do_clear ) clear() ;
	}
	void fromIR ( TIntermediateResult &r ) {
		setMode ( r.mode ) ;
		for ( map <TIntermediateResultType,bool>::iterator i = r.item_map.begin() ; i != r.item_map.end() ; i++ ) item_map[i->first] = true ;
		item_vector.reserve ( item_vector.size() + r.item_vector.size() ) ;
		for ( uint32_t a = 0 ; a < r.item_vector.size() ; a++ ) item_vector.push_back ( r.item_vector[a] ) ;
		sortUniq() ;
	}
	void setMap ( map<TItem,bool> &target ) {
		setMode ( IR_MAP ) ;
		for ( map <TIntermediateResultType,bool>::iterator i = item_map.begin() ; i != item_map.end() ; i++ ) target[TItem(i->first)] = true ; // TODO better
		for ( uint32_t a = 0 ; a < item_vector.size() ; a++ ) target[TItem(item_vector[a])] = true ;
	}

/*
	// Experimental, for NOLINK
	void subsetFromSortedItemList ( vector <TItem> &itemlist ) {
		
		vector <TIntermediateResultType> tmp ;
		tmp.resize ( size() + itemlist.size() ) ;
		
		if ( mode == IR_MAP ) {
			for ( map <TIntermediateResultType,bool>::iterator i = item_map.begin() ; i != item_map.end() ; i++ ) tmp.push_back(i->first) ;
		} else {
			for ( uint32_t b = 0 ; b < item_vector.size() ; b++ ) tmp.push_back ( item_vector[b] ) ;
		}
		clear() ;
		item_vector.reserve ( tmp.size() ) ;

		for ( uint32_t a = 0 ; a < itemlist.size() ; a++ ) tmp.push_back ( itemlist[a].item ) ;
		
		sort ( tmp.begin() , tmp.end() ) ;
		
		for ( uint32_t a = 1 ; a < tmp.size() ; a++ ) {
			if ( tmp[a] == tmp[a-1] ) item_vector.push_back ( tmp[a] ) ;
		}
		
		mode = IR_VECTOR ;
		vector_is_sorted = true ;
	}
*/

	void subsetResult ( vector <TItem> &result , bool negative = false ) {

		vector <TItem> r2 ;
		r2.reserve ( result.size() ) ;
		
		if ( mode == IR_MAP ) {

			for ( uint32_t b = 0 ; b < result.size() ; b++ ) {
				if ( !hasItem(result[b]) ) r2.push_back ( result[b] ) ;
			}

		} else {
		
			sortVector() ;
			
			uint32_t p_me = 0 , p_res = 0 ;
			while ( p_me < item_vector.size() && p_res < result.size() ) {
				if ( item_vector[p_me] == result[p_res] ) {
					if ( !negative ) r2.push_back ( result[p_res] ) ;
					p_res++ ;
					p_me++ ;
				} else if ( item_vector[p_me] < result[p_res] ) {
					p_me++ ;
				} else {
					if ( negative ) r2.push_back ( result[p_res] ) ;
					p_res++ ;
				}
			}
			
			while ( negative && p_res < result.size() ) r2.push_back ( result[p_res++] ) ;
		
		}
		
		result.swap ( r2 ) ;
	}
	
private:
	void sortVector () {
		if ( vector_is_sorted ) return ;
		if ( item_vector.empty() ) return ;
		sort (item_vector.begin(), item_vector.end());
	}
	void sortUniq () {
		if ( mode != IR_VECTOR ) return ;
		sortVector() ;
		std::vector<TIntermediateResultType>::iterator it;
		it = std::unique (item_vector.begin(), item_vector.end());
		item_vector.resize( std::distance(item_vector.begin(),it) );
	}
	inline void setMode ( uint8_t nm ) {
		if ( mode == nm ) return ;
//		cout << "Changing mode from " << (int) mode << " to " << (int) nm << endl ;
		if ( size() == 0 ) {
			// Dummy, to save time...
		} else if ( mode == IR_MAP ) {
			item_vector.clear() ;
			item_vector.reserve ( item_map.size() ) ;
			for ( map <TIntermediateResultType,bool>::iterator i = item_map.begin() ; i != item_map.end() ; i++ ) item_vector.push_back ( i->first ) ;
			item_map.clear() ;
			vector_is_sorted = false ;
		} else {
			item_map.clear() ;
			for ( uint32_t a = 0 ; a < item_vector.size() ; a++ ) item_map[item_vector[a]] = true ;
			item_vector.clear() ;
		}
		mode = nm ;
	}

	map <TIntermediateResultType,bool> item_map ;
	vector <TIntermediateResultType> item_vector ;
	uint8_t mode ;
	bool vector_is_sorted ;
} ;

// MISC END



// STATEMENT BEGIN

class TQualifiers ;
class TAroundCoordinate ;
template <class T> class TItemQuery ;

template <class T> class TStatement {
public:
	TStatement () : rank(RANK_DEFAULT),qualifiers(NULL) {}
	TStatement ( TItem new_item , T new_value , TQualifiers *qs = NULL ) ;
	TStatement ( TItemNumber new_item , T new_value , TQualifiers *qs = NULL ) ;
//	TStatement ( TStatement <T> other ) { setFrom ( other ) ; }
	~TStatement () ;

	void writeBinary ( FILE *out ) ;
	void readBinary ( FILE *in , uint8_t major_version , uint8_t minor_version ) ;
	void deleteQualifiers() ;
	inline bool hasQualifiers() { return qualifiers ? true : false ; }
	inline TQualifiers *getQualifiers() { return qualifiers ; }
	inline TItemNumber getItem() { return item ; }
	void setFrom ( TStatement <T> &other ) ;
	inline string getOutputString() { return value.getOutputString(item) ; }

	TItemNumber item ;
	T value ;
	uint8_t rank ;
	TQualifiers *qualifiers ;
/*	
	TStatement <T> & operator = ( TStatement <T> other ) {
		setFrom ( other ) ;
		return *this ;
	}
*/
} ;

template<typename T> bool operator<(const TStatement<T> &f1,const TStatement<T> &f2) {
	return ( f1.value < f2.value ) || ( f1.value == f2.value && ( f1.item == 0 || f2.item == 0 || f1.item < f2.item ) ) ;
}

template <class T> class TStatementList {
public:
	TStatementList () { sorter = NULL ; no_qualifier_nuke = false ; }
	~TStatementList () ;
	inline uint32_t size () { return list.size() ; }
	inline void resize ( uint32_t new_size ) { list.resize ( new_size ) ; }
	inline void swap ( TStatementList <T> &other ) { list.swap ( other.list ) ; }
	inline void clear () { list.clear() ; }
	void sortAll () {
		for ( uint32_t a = 0 ; a < list.size() ; a++ ) {
			if ( sorter ) sort ( list[a].begin() , list[a].end() , sorter ) ;
			else sort ( list[a].begin() , list[a].end() ) ;
		}
	}
	
	inline vector < TStatement <T> > & operator [] ( uint32_t index ) { return list[index] ; }
	void setAllItems ( map <TItem,bool> &m ) {
		for ( uint32_t a = 0 ; a < list.size() ; a++ ) {
			for ( uint32_t b = 0 ; b < list[a].size() ; b++ ) m[list[a][b].item] = true ;
		}
	}
	
	void duplicateProps ( TStatementList <T> &w , TStatementList <T> &nw , map <TItem,bool> &m ) {
		nw.list.resize ( list.size()>w.list.size()?list.size():w.list.size() ) ;
		for ( uint32_t a = 0 ; a < list.size() ; a++ ) {
			uint32_t new_size = list[a].size() ;
			if ( w.list.size() > a ) new_size += w.list[a].size() ;
			nw.list[a].reserve ( new_size ) ;
			for ( uint32_t b = 0 ; b < list[a].size() ; b++ ) {
				if(m.find(list[a][b].item)==m.end()) {
					nw.list[a].push_back(list[a][b]);
				}
			}
		}
	}
	
	void removeItems ( vector <TItemNumber> &items ) {
		map <TItemNumber,bool> remove ;
		for ( uint32_t b = 0 ; b < items.size() ; b++ ) remove[items[b]] = true ;
		for ( uint32_t p = 0 ; p < list.size() ; p++ ) {
			vector <TStatement<T> > tmp ;
			tmp.reserve ( list[p].size() ) ;
			for ( typename vector<TStatement<T> >::iterator i = list[p].begin() ; i != list[p].end() ; i++ ) {
				if ( remove.find(i->item) != remove.end() ) {
//					cerr << "Removing item " << i->item << endl ;
					continue ;
				}
				tmp.push_back ( *i ) ;
			}
			list[p].swap ( tmp ) ;
		}
	}

	void removeValues ( vector <T> &values ) {
		map <T,bool> remove ;
		for ( uint32_t b = 0 ; b < values.size() ; b++ ) remove[values[b]] = true ;
		for ( uint32_t p = 0 ; p < list.size() ; p++ ) {
			vector <TStatement<T> > tmp ;
			tmp.reserve ( list[p].size() ) ;
			for ( typename vector<TStatement<T> >::iterator i = list[p].begin() ; i != list[p].end() ; i++ ) {
				if ( remove.find(i->value) != remove.end() ) {
//					cerr << "Removing value " << i->value.toString() << endl ;
					continue ;
				}
				tmp.push_back ( *i ) ;
			}
			list[p].swap ( tmp ) ;
		}
	}
	
	void getAllItems ( map <TItemNumber,bool> &items ) {
		for ( TPropertyNumber p = 1 ; p < list.size() ; p++ ) {
			for ( uint32_t b = 0 ; b < list[p].size() ; b++ ) items[list[p][b].item] = true ;
		}
	}
	
	void updateFrom ( TStatementList <T> &other , map <TItemNumber,bool> &remove ) {
		other.no_qualifier_nuke = true ; // to prevent duplicate deletion of qualifiers. TODO FIXME HACK UGLY OHGODMYEYES
		if ( other.list.size() > list.size() ) list.resize ( other.list.size() ) ;
		for ( TPropertyNumber p = 1 ; p < other.list.size() ; p++ ) {
			
			// Remove those from current set
			vector <TStatement<T> > tmp ;
			tmp.reserve ( list[p].size() ) ;
			for ( typename vector<TStatement<T> >::iterator i = list[p].begin() ; i != list[p].end() ; i++ ) {
				if ( remove.find(i->item) != remove.end() ) continue ;//i = list[p].erase(i) ;
				tmp.push_back ( *i ) ;
//				else i++ ;
			}
			list[p].swap ( tmp ) ;
			
			// Append new set
			list[p].insert ( list[p].end() , other.list[p].begin() , other.list[p].end() ) ;
		}
		
		// Assuming this will be sorted later!
	}

	// Sets this copy to be the merge of the sorted lists l1 and l2, removing items from l1 only
	void mergeFrom ( TStatementList <T> &l1 , TStatementList <T> &l2 , map <TItemNumber,bool> &remove ) {
		TPropertyNumber max_prop = l1.list.size()>l2.list.size() ? l1.list.size() : l2.list.size() ;
		list.clear() ;
		list.resize ( max_prop ) ;

		for ( TPropertyNumber p = 0 ; p < max_prop ; p++ ) {

			if ( p >= l2.list.size() ) {
				list[p].resize ( l1.list[p].size() ) ;
				for ( uint32_t i = 0 ; i < l1.list[p].size() ; i++ )
					list[p][i].setFrom (l1.list[p][i] ) ;
				continue ;
			}

			if ( p >= l1.list.size() ) {
				list[p].resize ( l2.list[p].size() ) ;
				for ( uint32_t i = 0 ; i < l2.list[p].size() ; i++ )
					list[p][i].setFrom (l2.list[p][i] ) ;
				continue ;
			}
			
			
			list[p].resize ( l1.list[p].size() + l2.list[p].size() ) ;
			uint32_t i = 0 ;
			typename vector < TStatement <T> >::iterator i1 = l1.list[p].begin() ;
			typename vector < TStatement <T> >::iterator i2 = l2.list[p].begin() ;
			while ( i1 != l1.list[p].end() || i2 != l2.list[p].end() ) {
				if ( i1 == l1.list[p].end()  ) {
					list[p][i++].setFrom ( *i2++ ) ;
					continue ;
				}
				
				if ( remove.find(i1->item) != remove.end() ) {
					i1++ ;
					continue ;
				}
				
				if ( i2 == l2.list[p].end() ) {
					list[p][i++].setFrom ( *i1++ ) ;
					continue ;
				}
				
				if ( *i1 < *i2 ) list[p][i++].setFrom ( *i1++ ) ;
				else list[p][i++].setFrom ( *i2++ ) ;
			}
			list[p].resize ( i ) ; // Should still be sorted!
		}
	}
	
	// Marks all items with statements for that property in a map
	void hadThatProp ( TPropertyNumber prop , TIntermediateResult &hadthat , TItemQuery <TQualifiers> *ql ) ;
	
	
	// Marks all items with a statement for that property/value combination in a map
	void markEqualRange ( TPropertyNumber prop , TStatement <T> &lookup , TIntermediateResult &map_check , map <TItem,bool> &map_write ) {
		if ( prop >= list.size() ) return ;
		typedef typename vector<TStatement<T> >::iterator t1 ;
		pair <t1,t1> range ;
		if ( sorter ) range =  std::equal_range (list[prop].begin(), list[prop].end(), lookup , sorter );
		else range =  std::equal_range (list[prop].begin(), list[prop].end(), lookup );
		for ( t1 ii = range.first ; ii != range.second ; ii++ ) {
			if ( !map_check.hasItem(ii->value) ) map_write[ii->value] = true ;
		}
	}
	
	// Returns total number of statements for this property
	uint32_t getTotalCount () {
		uint32_t total = 0 ;
		for ( uint32_t a = 0 ; a < list.size() ; a++ ) {
			total += list[a].size() ;
		}
		return total ;
	}
	
	// Adds new statements from a "diff" list during update/merge
	void addNewProps ( TStatementList <T> &source ) {
		for ( uint32_t a = 0 ; a < source.list.size() ; a++ ) {
			for ( uint32_t b = 0 ; b < source.list[a].size() ; b++ ) {
				list[a].push_back(source.list[a][b]);
			}
		}
	}
	
	void writeBinary ( FILE *out ) {
		uint32_t num_props = list.size() ;
		fwrite(&num_props, sizeof(num_props), 1, out);
		for ( uint32_t p = 0 ; p < num_props ; p++ ) {
			uint32_t num_prop = list[p].size() ;
			fwrite(&num_prop, sizeof(num_props), 1, out);
			for ( uint32_t q = 0 ; q < num_prop ; q++ ) {
				list[p][q].writeBinary ( out ) ;
			}
		}
	}

	void readBinary ( FILE *in , uint8_t major_version , uint8_t minor_version ) {
		uint32_t num_props ;
		list.clear() ;
		fread(&num_props, sizeof(num_props), 1, in);
		list.resize ( num_props ) ;
		for ( uint32_t p = 0 ; p < num_props ; p++ ) {
			uint32_t num_items ;
			fread(&num_items, sizeof(num_items), 1, in);
			list[p].resize ( num_items ) ;
			for ( uint32_t q = 0 ; q < num_items ; q++ ) {
				list[p][q].readBinary ( in , major_version , minor_version ) ;
			}
		}
	}
	
	string dumpItemData ( TItem i ) {
		std::ostringstream ret ;
		for ( uint32_t a = 0 ; a < list.size() ; a++ ) {
			for ( uint32_t b = 0 ; b < list[a].size() ; b++ ) {
				if ( list[a][b].item != i.item ) continue ;
				ret << a << "\t" << list[a][b].value.toString() << endl ;
				if ( list[a][b].qualifiers ) {
					ret << "Qualifiers:\n" ;
					ret << list[a][b].qualifiers->dumpItemData() ;
				}
			}
		}
		return ret.str() ;
	}


	void findMatches ( TPropertyNumber p , map <T,bool> &targets , TItemQuery <TQualifiers> *ql , TIntermediateResult &hadthat ) ;
	void findBetween ( TPropertyNumber p , T from , T to , TItemQuery <TQualifiers> *ql , TIntermediateResult &hadthat ) ;
	void findAround ( TAroundCoordinate &a , TItemQuery <TQualifiers> *ql , TIntermediateResult &hadthat ) ;

	void addEntry ( TPropertyNumber p , TStatement <T> &entry ) {
		if ( p >= list.size() ) list.resize ( p+1 ) ;
		list[p].push_back ( entry ) ;
	}

	void addOutputStrings ( TPropertyNumber p , vector <TItem> &items , string &s , map <T,bool> *targets = NULL ) {
		if ( p >= list.size() ) return ;
		
		for ( uint32_t b = 0 ; b < list[p].size() ; b++ ) {
			if ( !binary_search(items.begin(), items.end(), list[p][b].item) ) continue ;
			if ( targets ) {
				if ( targets->find(list[p][b].value) == targets->end() )
					targets->insert ( std::pair<T,bool>(list[p][b].value,true) ) ;
			}
			if ( s.empty() ) {
				s = list[p][b].getOutputString() ;
				s.reserve ( items.size() * ( s.length()+5 ) ) ;
			} else {
				s += "," + list[p][b].getOutputString() ;
			}
		}
	}
	
	vector < vector < TStatement <T> > > list ;
	bool no_qualifier_nuke ;
	
	// Non-default sort/match function. Used for TItem.
	bool (*sorter) ( TStatement <T> i1 , TStatement <T> i2 ) ;
} ;



// STATEMENT END



// MISC CLASSES BEGIN

class THasClaim {
public:
	THasClaim () {}
	bool hasItems () { return items.size() > 0 || !query.empty() ; }
	string asString () {
		std::ostringstream s ;
		s << prop ;
		if ( hasItems() ) {
			s << ":" ;
			if ( query.empty() ) {
				for ( uint32_t a = 0 ; a < items.size() ; a++ ) {
					if ( a > 0 ) s << ',' ;
					s << items[a] ;
				}
			} else {
				s << "(" << query << ")" ;
			}
		}
		return s.str() ;
	}
	
	TPropertyNumber prop ;
	vector <TItem> items ;
	string query ;
} ;


class TAroundCoordinate {
public:
	TPropertyNumber prop ;
	TCoordinate coord ;
	float radius ;
} ;


class TLabelPair {
public:
	map <string,string> label ;
} ;

// THESE SHOULD BE DONE WITH TEMPLATE CLASSES!
typedef pair <TItem,pair <TTime,TTime> > TBetween ; // For "BETWEEN"
typedef pair <TItem,pair <float,float> > TQuantityRange ; // For "QUANTITY"


typedef vector < TStatement <TItem> > Tvsi ;
typedef pair <TPropertyNumber,string> Tppns ;
typedef map <string , vector <TItem> > Tmsvi ;


// MISC CLASSES END



//________________________________________________________________________________________________


template <class T> class TItemQuery {
public :
	TItemQuery () : qualifier_query(NULL),mode(IQ_UNKNOWN) {}
	bool parse ( string q , T &w ) ;
	bool run ( T *w = NULL ) ;
	string describe () ;

	vector <TPropertyNumber> follow_forward , follow_reverse ;
	vector <TItem> root_items , result ;
	vector <THasClaim> has_claims ;
	vector <TItemQuery<T> > subqueries ;
	vector <Tppns> has_strings ;
	vector <TBetween> has_between ; // time
	vector <TAroundCoordinate> has_around ; // coord
	vector <string> has_link ;
	vector <TQuantityRange> has_quantity ;

	bool constructQuery ( list <string> &parts , T *w = NULL ) ; // Should be protected, but compiler horror in tryParseQualifiers...
	
protected:
	void guessMode () ;
	void followWeb ( TIntermediateResult &had , T &w ) ;
	void followChains ( TItem item , T &w , bool forward ) ;
	void findItemsWithClaim ( THasClaim &hc , T &w , TItemQuery <TQualifiers> *ql = NULL ) ;
	void findItemsWithString ( TPropertyNumber p , string i , T &w , TItemQuery <TQualifiers> *ql = NULL ) ;
	void findItemsBetween ( TPropertyNumber p , TTime from , TTime to , T &w , TItemQuery <TQualifiers> *ql = NULL ) ;
	void findQuantities ( TPropertyNumber p , float from , float to , T &w , TItemQuery <TQualifiers> *ql = NULL ) ;
	void findItemsAround ( TAroundCoordinate a , T &w , TItemQuery <TQualifiers> *ql = NULL ) ;
	void mergeResults ( vector <TItem> &r1 , vector <TItem> &r2 ) ;
	bool constructItemList ( list <string> &parts , vector <TItem> &ret ) ;
	bool constructClaimList ( list <string> &parts , vector <THasClaim> &ret ) ;
	bool constructItemsList ( list <string> &parts , vector <THasClaim> &ret ) ;
	bool constructStringList ( list <string> &parts , vector <Tppns> &ret ) ;
	bool constructTimeList ( list <string> &parts , vector <TBetween> &ret ) ;
	bool construcTQuantityList ( list <string> &parts , vector <TQuantityRange> &ret ) ;
	bool constructCoordList ( list <string> &parts , vector <TAroundCoordinate> &ret ) ;
	bool constructLinkList ( list <string> &parts , vector <string> &ret ) ;
	bool getItemOrNestedQueryResults ( list <string> &parts , THasClaim &hc ) ;
	bool tryParseQualifiers ( list <string> &parts , TItemQuery <T> &q ) ;
	bool extractSubList ( list <string> &parts , list <string> &sublist , string begin , string end ) ;

	TItemQuery <TQualifiers> *qualifier_query ;
	T *w_ ;
	TIntermediateResult hadthat ;
	uint8_t mode ;
} ;

//________________________________________________________________________________________________


class TItemSet ;

template <class T> void addStatementOrQualifiers ( T &base , TItem &item , MyJSON *m , MyJSON *qual = NULL ) ;
template <class T> void addStatementOrQualifiers2 ( TPropertyNumber p , T &base , TItem &item , MyJSON *m ) ;




// QUALIFIERS BEGIN

template <class T> class TQualifierStatement {
public:

	TQualifierStatement () {}
	TQualifierStatement ( TPropertyNumber _prop , T &_value ) : prop(_prop),value(_value) {} ;

	inline bool hasQualifiers() { return false ; } // Dummy
	inline TQualifiers * getQualifiers() { return NULL ; } // Dummy
	inline TItemNumber getItem() { return 1 ; } // Dummy

	void writeBinary ( FILE *out ) {
		FWRITE ( prop ) ;
		value.writeBinary ( out ) ;
	}

	void readBinary ( FILE *in , uint8_t major_version , uint8_t minor_version ) {
		FREAD ( prop ) ;
		value.readBinary ( in , major_version , minor_version ) ;
	}
	
	TPropertyNumber prop ;
	T value ;
} ;


template <class T> class TQualifierStatements {
public:

	void readBinary ( FILE *in , uint8_t major_version , uint8_t minor_version ) {
		uint32_t qualNumber ;
		FREAD ( qualNumber ) ;
		if ( qualNumber == 0 ) return ;
		list.resize ( qualNumber ) ;
		for ( uint32_t a = 0 ; a < qualNumber ; a++ ) {
			list[a].readBinary ( in , major_version , minor_version ) ;
		}
	}

	void writeBinary ( FILE *out ) {
		uint32_t qualNumber = list.size() ;
		FWRITE(qualNumber) ;
		for ( uint32_t a = 0 ; a < qualNumber ; a++ ) list[a].writeBinary ( out ) ;
	}

	void hadThatProp ( TPropertyNumber prop , TIntermediateResult &hadthat , TItemQuery <TQualifiers> *ql ) {
		for ( uint32_t a = 0 ; a < list.size() ; a++ ) {
			if ( list[a].prop == prop ) hadthat.addItem(QUALIFIER_DUMMY_ITEM) ;
		}
	}

	void findMatches ( TPropertyNumber p , map <T,bool> &targets , TItemQuery <TQualifiers> *ql , TIntermediateResult &hadthat ) {
		for ( uint32_t a = 0 ; a < list.size() ; a++ ) {
			if ( targets.find(list[a].value) != targets.end() ) hadthat.addItem(QUALIFIER_DUMMY_ITEM) ;
		}
	}
	
	void findBetween ( TPropertyNumber p , T from , T to , TItemQuery <TQualifiers> *ql , TIntermediateResult &hadthat ) {
		for ( uint32_t a = 0 ; a < list.size() ; a++ ) {
			if ( list[a].value < from ) continue ;
			if ( to < list[a].value ) continue ;
			hadthat.addItem(QUALIFIER_DUMMY_ITEM) ;
			break ;
		}
	}
	
	void findAround ( TAroundCoordinate &a , TItemQuery <TQualifiers> *ql , TIntermediateResult &hadthat ) {
		for ( uint32_t i = 0 ; i < list.size() ; i++ ) {
			if ( list[i].prop == a.prop && list[i].value.isAround ( a.coord , a.radius ) )  hadthat.addItem(QUALIFIER_DUMMY_ITEM) ;
		}
	}

	void markEqualRange ( TPropertyNumber prop , TStatement <T> &lookup , map <TItem,bool> &map_check , map <TItem,bool> &map_write ) {} // Dummy; tree/web only

	inline uint32_t size() { return list.size() ; }
	inline TQualifierStatement<T> & operator [] ( uint32_t index ) { return list[index] ; }

	void addEntry ( TPropertyNumber p , TStatement <T> &entry ) {
		list.push_back ( TQualifierStatement <T> ( p , entry.value ) ) ;
	}

	string dumpItemData () {
		std::ostringstream ret ;
		for ( uint32_t a = 0 ; a < list.size() ; a++ ) {
			ret << "  Qualifier: P" << list[a].prop << " (" << list[a].value.type() << ")\t" << list[a].value.toString() << endl ;
		}
		return ret.str() ;
	}
	
	vector <TQualifierStatement<T> > list ;
} ;


class TQualifiers {
public:
	TQualifiers() : referenced(1) {}
	
	void readBinary ( FILE *in , uint8_t major_version , uint8_t minor_version ) {
		props.readBinary ( in , major_version , minor_version ) ;
		strings.readBinary ( in , major_version , minor_version ) ;
		times.readBinary ( in , major_version , minor_version ) ;
		coords.readBinary ( in , major_version , minor_version ) ;
		quantities.readBinary ( in , major_version , minor_version ) ;
		monolingual.readBinary ( in , major_version , minor_version ) ;
	}
	
	void writeBinary ( FILE *out ) {
		props.writeBinary ( out ) ;
		strings.writeBinary ( out ) ;
		times.writeBinary ( out ) ;
		coords.writeBinary ( out ) ;
		quantities.writeBinary ( out ) ;
		monolingual.writeBinary ( out ) ;
	}

	void findItemsWithoutLink ( vector <string> &has_link , TIntermediateResult &hadthat ) {} // Dummy
	void findItemsWithLink ( string project , TIntermediateResult &hadthat , bool remove = false ) {} // Dummy
	void findItemsWithoutLabel ( vector <string> &has_label , TIntermediateResult &hadthat ) {} // Dummy
	void findItemsWithLabel ( string project , TIntermediateResult &hadthat , bool remove = false ) {} // Dummy
	void followChains ( TItem &item , bool forward , TIntermediateResult &hadthat , vector <TPropertyNumber> &follow_forward , vector <TPropertyNumber> &follow_reverse ) {} // Dummy
	void followWeb ( TIntermediateResult &had , TIntermediateResult &hadthat , vector <TPropertyNumber> &follow_forward , vector <TPropertyNumber> &follow_reverse ) {} // Dummy
	const char *type () { return "tqualifiers" ; }
	int getQueryCount () { return 0 ; }

	string dumpItemData () {
		string ret ;
		ret += props.dumpItemData() ;
		ret += strings.dumpItemData() ;
		ret += coords.dumpItemData() ;
		ret += times.dumpItemData() ;
		ret += quantities.dumpItemData() ;
		ret += monolingual.dumpItemData() ;
		return ret ;
	}

	int8_t referenced ;

	TQualifierStatements <TItem> props ;
	TQualifierStatements <TString> strings ;
	TQualifierStatements <TCoordinate> coords ;
	TQualifierStatements <TTime> times ;
	TQualifierStatements <TQuantity> quantities ;
	TQualifierStatements <TMonolingual> monolingual ;
	
} ;

class TWikidataDB ;

class TItemSet {
public :
	TItemSet () ;
	void import_item_connections ( FILE *file , bool initial_import = true ) ;
	void import_xml_dump ( FILE *file , bool initial_import = true ) ;
	void import_json_dump ( FILE *file ) ;
	bool updateFromFile ( string filename , bool is_binary = false ) ;
	void queryStatus ( int32_t diff ) { query_count += diff ; }
	bool isBusy () { return busy || (!is_ready) ; }
	void mergeFromUpdate ( TItemSet &w ) ;
	void writeClaims ( string filename ) ;
	string getStatsString() ;
	string getItemLabel ( TItem q , string lang ) { return getLabel ( m_item , q , lang ) ; } ;
	string getPropLabel ( TItem p , string lang ) { return getLabel ( m_prop , p , lang ) ; } ;
	void getPropJSONForItems ( TPropertyNumber p , vector <TItem> &items , string &s , bool add_target_items ) ;
	TPropertyNumber getMaxProp () ;
	Tmsvi getMultipleStrings ( TPropertyNumber p ) ;
	Tvsi getMissingPairs ( TPropertyNumber p1 , vector <TPropertyNumber> &p2 ) ;
	string dumpItemData ( TItem i ) ;
	void removeItems ( vector <TItemNumber> &items ) ;
	
	void importBinary ( string fn , bool just_time = false ) ;
	void importBinary ( FILE *in , bool just_time = false ) ;
	void exportBinary ( string fn ) ;
	void exportBinary ( FILE *out ) ;
	void import_binary_fofn ( bool reset = false ) ;

	string time_start , time_end ;
	string binary_fofn ;
	vector <string> fofn_files ;
	
	void findItemsWithoutLink ( vector <string> &has_link , TIntermediateResult &hadthat ) ;
	void findItemsWithLink ( string project , TIntermediateResult &hadthat , bool remove = false ) ;
	void findItemsWithoutLabel ( vector <string> &has_label , TIntermediateResult &hadthat ) ;
	void findItemsWithLabel ( string project , TIntermediateResult &hadthat , bool remove = false ) ;
	void followChains ( TItem &item , bool forward , TIntermediateResult &hadthat , vector <TPropertyNumber> &follow_forward , vector <TPropertyNumber> &follow_reverse ) ;
	void followWeb ( TIntermediateResult &had , TIntermediateResult &hadthat , vector <TPropertyNumber> &follow_forward , vector <TPropertyNumber> &follow_reverse ) ;
	const char *type () { return "titemset" ; }
	int getQueryCount () { return query_count ; }

	void addOutputStrings ( TPropertyNumber p , vector <TItem> &items , string &s , map <TItem,bool> *targets = NULL ) {
		bool do_sort = false ;
		for ( uint32_t a = 1 ; a < items.size() ; a++ ) {
			if ( items[a-1] > items[a] ) {
				do_sort = true ;
				break ;
			}
		}
		if ( do_sort ) sort ( items.begin() , items.end() ) ;


		string t ;
		props.addOutputStrings ( p , items , t , targets ) ;
		strings.addOutputStrings ( p , items , t  ) ;
		coords.addOutputStrings ( p , items , t ) ;
		times.addOutputStrings ( p , items , t ) ;
		quantities.addOutputStrings ( p , items , t ) ;
		monolingual.addOutputStrings ( p , items , t ) ;
		
		if ( t.empty() ) return ;
		
		char c[100] ;
		sprintf ( c , "\"%d\":[" , p ) ;
		s += c + t + "]" ;
		
	}
	

	TStatementList <TItem> props , rprops ;
	TStatementList <TString> strings ;
	TStatementList <TCoordinate> coords ;
	TStatementList <TTime> times ;
	TStatementList <TQuantity> quantities ;
	TStatementList <TMonolingual> monolingual ;
	Tmsvi links , labels ;
	TWikidataDB *db ;
	bool is_ready ;


protected:
	friend class TWikidataDB ;
	
	void setBusy ( bool b ) ;
	void fixRprops () ;
	void prepareProps() ;
	string getLabel ( map <TItem,TLabelPair> &m , TItem i , string lang ) ;
	void mergeItemLists ( vector <TItem> &r1 , vector <TItem> &r2 , vector <TItem> &r ) ;
	void resetFromItemset ( TItemSet &i ) ;
	void clear () ;
	void addItemJSON ( char *buffer ) ;
	void parseJSON ( MyJSON &j ) ;
	long getMicrotime() ;
//	void mergeFromUpdateSub ( TItemSet &w ) ;
	void mergeTmsvi ( Tmsvi &target , Tmsvi &l1 , Tmsvi &l2 ) ;
	
	map <TItem,TLabelPair> m_item , m_prop ;
	bool busy ;
	int32_t query_count ;
	map <string,bool> update_files ;
} ;




class TWikidataDB {
public:
	TWikidataDB () {} ;
	TWikidataDB ( string config_file , string host ) ;
	bool updateRecentChanges ( TItemSet &target ) ;
	void getRedirects ( map <TItemNumber,bool> &remove ) ;
	void getDeletedItems ( map <TItemNumber,bool> &remove ) ;
	char *getTextFromURL ( string url ) ;
	~TWikidataDB () ;

	uint32_t batch_size ; // ATTENTION: If this is lower than the number of edits in a specific second, it may cause a loop. Default is 1000; keep it well >100 !
	
protected:
	MYSQL mysql;
	string _host , _config_file , _database ;
	
	void doConnect ( bool first = false ) ;
	void runQuery ( string sql ) ;
	MYSQL_RES *getQueryResults ( string sql ) ;
	void finishWithError ( string msg = "" ) ;


	struct MemoryStruct {
	  char *memory;
	  size_t size;
	};

	static size_t WriteMemoryCallback(void *contents, size_t size, size_t nmemb, void *userp) {
	  size_t realsize = size * nmemb;
	  struct MemoryStruct *mem = (struct MemoryStruct *)userp;
 
	  mem->memory = (char*) realloc(mem->memory, mem->size + realsize + 1);
	  if(mem->memory == NULL) {
		/* out of memory! */ 
		printf("not enough memory (realloc returned NULL)\n");
		return 0;
	  }
 
	  memcpy(&(mem->memory[mem->size]), contents, realsize);
	  mem->size += realsize;
	  mem->memory[mem->size] = 0;
 
	  return realsize;
	}
 
} ;




void split ( char sep , char *s , vector <char *> &vc ) ;
void escapeJsonStringToStringStream(const std::string& input,std::ostringstream &ss) ;
string escapeJsonStringToStringStream(const std::string& input) ;
void myReplace(std::string& str, const std::string& oldStr, const std::string& newStr);

#endif
