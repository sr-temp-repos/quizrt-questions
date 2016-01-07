#include <iostream>
#include <string>
#include "wd_inmem.h"
#include "TItemQuery.cpp" // FIXME This should work be defining a few dummy templates in TItemQuery.cpp but for some reason it does not. This works, but is ugly!

int main ( int argc , char *argv[] ) {

	if ( argc == 1 ) {
		cout << "wd_tool COMMAND" << endl ;
		cout << " dump2bin          Converts an XML dump (piped in) to binary format (piped out)" << endl ;
		cout << " json2bin ENDTIME  Converts a JSON dump (piped in) to binary format (piped out)" << endl ;
		cout << "                   ENDTIME in format 2014-08-24T12:22:41Z" << endl ;
		cout << " merge [F1 F2...]  Merges multiple binary files into one" << endl ;
		cout << " stats [F1]        Prints key values for the dataset" << endl ;
		cout << " times [F1]        Prints first and last time stamp in the dataset" << endl ;
		cout << " query [F1] [Q]    Performs a query on the dataset" << endl;
		return 0 ;
	}
	
	string cmd = argv[1] ;

	if ( cmd == "merge" ) {
		TItemSet wd ;
		for ( int a = 2 ; a < argc ; a++ ) {
			if ( a == 2 ) {
				cerr << "Starting with " << argv[a] << endl ;
				wd.importBinary ( argv[a] ) ;
				cerr << wd.getStatsString() ;
			} else {
				cerr << "\nAdding " << argv[a] << endl ;
				TItemSet nwd ;
				nwd.importBinary ( argv[a] ) ;
				cerr << nwd.getStatsString() ;
				cerr << "  merged:\n" ;
				wd.mergeFromUpdate ( nwd ) ;
			}
		}
		wd.exportBinary ( stdout ) ;
		cerr << "\nTOTAL:\n" ;
		cerr << wd.getStatsString() ;
		return 0 ;
	}
	
	if ( cmd == "removeitems" ) {
		if ( argc != 3 ) {
			cerr << "Usage: cat item_numbers_to_delete | wd_tool removeitems [binary_file]" << endl ;
			return 0 ;
		}
		string file = argv[2] ;
		TItemSet wd ;
		wd.importBinary ( file ) ;
		vector <TItemNumber> items ;
		string s ;
		while ( getline ( cin , s ) ) {
			TItemNumber i = atol ( s.c_str()+1 ) ;
			items.push_back ( i ) ;
			cerr << i << endl ;
		}
		wd.removeItems ( items ) ;
		wd.exportBinary ( stdout ) ;
		cerr << wd.getStatsString() ;
		return 0 ;
	}
	
	if ( cmd == "dump2bin" ) {
//		_setmode( _fileno( stdout ), _O_BINARY ); 
		TItemSet wd ;
		wd.import_xml_dump ( stdin ) ;
		wd.exportBinary ( stdout ) ;
		cerr << wd.getStatsString() ;
		return 0 ;
	}

	if ( cmd == "json2bin" ) {
		if ( argc != 3 ) {
			cerr << "Usage: zcat JSON_DUMP | wd_tool json2bin ENDTIME (e.g. 2014-08-25T00:00:00Z)" << endl ;
			return 0 ;
		}
//		_setmode( _fileno( stdout ), _O_BINARY ); 
		TItemSet wd ;
		wd.import_json_dump ( stdin ) ;
		wd.time_end = argv[2] ;
		wd.exportBinary ( stdout ) ;
		cerr << wd.getStatsString() ;
		return 0 ;
	}
	
	if ( cmd == "stats" ) {
		if ( argc != 3 ) {
			cerr << "Usage: wd_tool stats [binary_file]" << endl ;
			return 0 ;
		}
		string file = argv[2] ;
		TItemSet wd ;
		wd.importBinary ( file ) ;
		cerr << wd.getStatsString() ;
		return 0 ;
	}


	if ( cmd == "times" ) {
		if ( argc != 3 ) {
			cerr << "Usage: wd_tool stats [binary_file]" << endl ;
			return 0 ;
		}
		string file = argv[2] ;
		TItemSet wd ;
		wd.importBinary ( file , true ) ;
		cout << wd.time_start << "\t" << wd.time_end << endl ;
		return 0 ;
	}

	if ( cmd == "item" ) {
		if ( argc != 4 ) {
			cerr << "Usage: wd_tool item [binary_file] [item-id]" << endl ;
			return 0 ;
		}
		string file = argv[2] ;
		TItem i ( atol ( argv[3] ) ) ;
		TItemSet wd ;
		wd.importBinary ( file ) ;
		
		cerr << wd.dumpItemData ( i ) ;
		
		return 0 ;
	}

	if ( cmd == "query" ) {
		if ( argc != 4 ) {
			cerr << "Usage: wd_tool query [binary_file] [query-string]" << endl ;
			return 0 ;
		}
		string file = argv[2] ;
		string query = argv[3] ;

		TItemSet wd ;
		wd.importBinary ( file  ) ;

		TItemQuery <TItemSet> q ;

		if ( !q.parse ( query , wd ) ) {
			cerr << "Cannot parse query: " + query << endl ;
			return 1 ;
		}

		q.run () ;
		string parsed_query = q.describe() ;

		vector <TItem> items = q.result ;

		for ( uint32_t a = 0 ; a < items.size() ; a++ ) {
			if ( a > 0 ) cout << "," ;
			cout << items[a].item ;
		}

		cout << endl ;

		return 0 ;
	}

	if ( cmd == "testing" ) {
		TWikidataDB db ( "/etc/wdq-mm" , "labsdb1002.eqiad.wmnet" ) ;
		db.batch_size = 10000 ;
		TItemSet target ;
		target.time_end = "2015-07-06T00:00:00Z" ;
		db.updateRecentChanges ( target ) ;
//		cout << db.getTextFromURL ( "https://www.wikidata.org/w/api.php?action=wbgetentities&ids=Q42&format=json" ) << endl ;
		return 0 ;
	}
	
/*
	if ( 0 ) {
		// Import
		TItemSet wd ;

		cout << "Importing..." << endl ;
	//	wd.import_item_connections ( stdin ) ;
		wd.import_xml_dump ( stdin ) ;

		cout << "Writing binary..." << endl ;	
		wd.exportBinary ( "test.wd" ) ;
	}
	
	
	if ( 1 ) {
		TItemSet wd ;
		cout << "Importing binary..." << endl ;
		wd.importBinary ( "test.wd" ) ;
	}
	
*/	
	
	cerr << "Unknown command " << cmd << endl ;
	return 0 ;
}

/*
Example:
clear ; make clean ; make ; gunzip -c dumps/20140825.json.gz | ./wd_tool json2bin 2014-08-25T00:00:00Z | head
*/