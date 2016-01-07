#ifndef __MYJSON_H__
#define __MYJSON_H__

#include <stdint.h>
#include <stdio.h>
#include <stdlib.h>
#include <iostream>
#include <string>
#include <vector>
#include <map>

using namespace std ;


#define MJS 0 // String
#define MJI 1 // Integer
#define MJF 2 // Float
#define MJA 3 // Array
#define MJO 4 // Object
#define MJN 5 // Null

class MyJSON ;

// TODO size checks etc.
class MyJSON {
public :
	MyJSON ( char *t = NULL ) { isa = 0 ; i = 0 ; f = 0 ; if ( t ) parse ( t ) ; }
	inline bool has(string s) { return o.find(s)!=o.end() ; }
	inline uint32_t size() { return isa==MJA?a.size():o.size() ; }
	inline MyJSON &get ( uint32_t key ) { return a[key] ; }
	inline MyJSON &get ( string key ) { return o[key] ; }
	void print ( ostream &out ) ;
	
	inline MyJSON & operator [] ( uint32_t key ) { return a[key] ; }
	inline MyJSON & operator [] ( string key ) { return o[key] ; }
	
	// TODO operators to cast into string, number

	uint8_t isa ; // Is a type MJ_
	char *s ;
//	string s ;
	vector <MyJSON> a ;
	map <string,MyJSON> o ;
	float f ;
	int32_t i ;

protected :
	char *parse ( char *t , int depth = 0 ) ;
} ;

#endif
