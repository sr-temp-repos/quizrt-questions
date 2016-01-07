#include "wd_inmem.h"
#include "TItemQuery.cpp" // FIXME This should work be defining a few dummy templates in TItemQuery.cpp but for some reason it does not. This works, but is ugly!
#include "mongoose.h" // https://code.google.com/p/mongoose/

class httpdata {
public:
	httpdata () { error = "OK" ; query_ms = -1 ; max_age = "604800" ; header_is_written = false ; } // Cache: 1 week
	void output ( string content ) ;
	void output2 ( string &content ) ;
	void writeJSONHeader() ;
	map <string,string> params ;
	string error , content_type , parsed_query , max_age ;
	struct mg_connection *conn ;
	vector <TItem> items ;
	float query_ms ;
	uint32_t item_num ;
	bool header_is_written ;
} ;


//________________________________________________________________________________________________

TItemSet web ;

map <string,string> config ;


//________________________________________________________________________________________________

void httpdata::output2 ( string &content ) {
	
/*	if ( content_type.empty() ) content_type = "text/plain;charset=utf-8" ;
	mg_printf(conn,
		"Content-Type: %s\r\n"
		"Max-Age: %s\r\n"
		"Content-Length: %d\r\n"
		"\r\n"
		, content_type.c_str() , max_age.c_str() , content.length() ) ;
*/	

	int err = mg_write ( conn , content.c_str() , content.length() ) ;
}

void httpdata::output ( string content ) {
	if ( content_type.empty() ) content_type = "text/plain;charset=utf-8" ;
	
	std::ostringstream pre ;
	pre << "HTTP/1.1 200 OK\r\n" ;
	pre << "Content-Type: " << content_type << "\r\n" ;
	pre << "Max-Age: " << max_age << "\r\n" ;
	pre << "Content-Length: " << content.length() << "\r\n" ;
	pre << "\r\n" ;
	pre << content ;
	content = pre.str() ;
	int err = mg_write ( conn , content.c_str() , content.length() ) ;
}

void httpdata::writeJSONHeader() {
	if ( header_is_written ) return ;
	header_is_written = true ;
	
	content_type = "application/json" ;
	
	mg_send_status(conn, 200) ;
	mg_send_header(conn, "Cache-Control", "no-cache");
	mg_send_header(conn, "Pragma", "no-cache");
	mg_send_header(conn, "Content-Type", content_type.c_str());
//	mg_send_header(conn, "Max-Age", max_age.c_str());
	mg_printf(conn,"\r\n");
}


string i2s ( uint32_t i ) {
	char t[100] ;
	sprintf ( t , "%d" , i ) ;
	return t ;
}

#define flush_size 10000
#define flush(s__) { if ( s.length() > flush_size ) { hd.output2 ( s ) ; s.clear() ; } }

static int reply ( httpdata &hd ) {

	hd.writeJSONHeader() ;



	string s ;
	if ( hd.params.find("callback") != hd.params.end() ) s += hd.params["callback"] + "(" ;

	s += "{\"status\":{\"error\":\"" + hd.error + "\"" ;
	s += ",\"items\":" + i2s(hd.item_num) ; //hd.items.size() ;
	if ( hd.query_ms >= 0 ) s += ",\"querytime\":\"" + i2s(hd.query_ms) + "ms\"" ;
	if ( !hd.parsed_query.empty() ) s += ",\"parsed_query\":\"" + escapeJsonStringToStringStream ( hd.parsed_query ) + "\"" ;
	s += "}" ;
	
	// Items
	s += ",\"items\":[" ;
	for ( uint32_t a = 0 ; a < hd.items.size() ; a++ ) {
		if ( a > 0 ) s += "," ;
		s += i2s(hd.items[a].item) ;
		flush(s) ;
	}
	s += "]" ;
	flush(s) ;
	
	
	// Props
//	vector <TPropertyNumber> props ;
	if ( hd.params.find("props") != hd.params.end() ) {
		bool first = true ;
		
		vector <TPropertyNumber> props2check ;
		string pparam = hd.params["props"] ;
		if ( pparam == "*" ) {
			TPropertyNumber max = web.getMaxProp() ;
			for ( uint32_t a = 1 ; a < max ; a++ ) props2check.push_back ( a ) ;
		} else {
			vector <char *> vc ;
			split ( ',' , (char*) hd.params["props"].c_str() , vc ) ;
			for ( uint32_t a = 0 ; a < vc.size() ; a++ ) props2check.push_back ( atoi(vc[a]) ) ;
		}
		
		
		s += ",\"props\":{" ;

		for ( uint32_t a = 0 ; a < props2check.size() ; a++ ) {

			TPropertyNumber p = props2check[a] ;
			vector <string> o ;

			string t ;
			web.getPropJSONForItems ( p , hd.items , t , true ) ;

			if ( pparam == "*" && t.empty() ) continue ;
			
			if ( !first ) s += "," ;
			first = false ;
			if ( t.empty() ) t = "[]" ;
			s += t ;
			flush(s) ;
		}

		s += "}" ;
	}
	
	


/*	
	if ( hd.params.find("labels") != hd.params.end() ) {
		vector <char *> vc ;
		split ( ',' , (char*) hd.params["labels"].c_str() , vc ) ;

		s << ",\"labels\":{" ;
		s << "\"items\":{" ;
		for ( uint32_t a = 0 ; a < hd.items.size() ; a++ ) {
			if ( a > 0 ) s << "," ;
			s << "\"" << hd.items[a].item << "\":\"" ;
			string label ;
			for ( uint32_t l = 0 ; l < vc.size() ; l++ ) {
				label = web.getItemLabel ( hd.items[a] , vc[l] ) ;
				if ( !label.empty() ) break ;
			}
			escapeJsonStringToStringStream ( label , s ) ;
			s << "\"" ;
		}		
		s << "},\"props\":{" ;
		for ( uint32_t a = 0 ; a < props.size() ; a++ ) {
			if ( a > 0 ) s << "," ;
			s << "\"" << props[a] << "\":\"" ;
			string label ;
			for ( uint32_t l = 0 ; l < vc.size() ; l++ ) {
				label = web.getPropLabel ( TItem(props[a]) , vc[l] ) ;
//				cerr << props[a] << " : " << vc[l] << " = " << label << endl ;
				if ( !label.empty() ) break ;
			}
			escapeJsonStringToStringStream ( label , s ) ;
			s << "\"" ;
		}
		s << "}}" ;
	}
*/

	s += "}" ;
	if ( hd.params.find("callback") != hd.params.end() ) s += ")" ;
	
//	string t = s.str() ;
/*	for ( uint32_t a = 0 ; a < t.length() ; a++ ) {
		if ( t[a] == 39 ) t[a] = '"' ;
	}*/
	hd.output2 ( s ) ;
	web.queryStatus ( -1 ) ; // Query is done
	return 1 ;
}

// ATTENTION! Only does text at the moment FIXME
static int serveFile ( httpdata &hd , string filename , string type = "" ) {
	if ( type.empty() ) {
		type = "application/octet-stream" ;
		if ( filename.substr ( filename.length()-5 , 5 ) == ".html" ) type = "text/html" ;
		if ( filename.substr ( filename.length()-4 , 4 ) == ".css" ) type = "text/css" ;
		if ( filename.substr ( filename.length()-4 , 4 ) == ".ico" ) type = "image/x-icon" ;
		if ( filename.substr ( filename.length()-4 , 4 ) == ".png" ) type = "image/png" ;
		if ( filename.substr ( filename.length()-3 , 3 ) == ".js" ) type = "application/json" ;
	}
//	cout << filename << " is of type " << type << endl ;
	std::ifstream ifs ( filename.c_str() ) ;
	std::string content ( (std::istreambuf_iterator<char>(ifs) ), (std::istreambuf_iterator<char>()) );
	hd.content_type = type ;
	hd.output ( content ) ;
	return MG_TRUE ;
}

static int stats ( httpdata &hd ) {
	std::ostringstream s ;

	string action = hd.params["action"] ;
	
	s << "<!DOCTYPE html>\n<html><head><meta charset='utf8' /><style>ol {padding-left:70px;}</style></head><body>" ;

	if ( action == "" ) {
		s << "<h1>Overview</h1>" ;
		s << "<pre>" << web.getStatsString() << "</pre>" ;
		
		s << "<div>Double strings (<a href='?action=doublestring&prop=214'>VIAF</a> " ; // , <a href='?action=doublestring'>all properties</a>,
		s << "<form method='get' action='?' style='display:inline'><input type='hidden' name='action' value='doublestring' /><input type='number' name='prop' /><input type='submit' value='single prop' /></form>)</div>" ;


		s << "<div>Missing property pairs (" ;
		s << "<a href='?action=missingpairs&prop1=22&prop2=40'>father but not child</a>, " ;
		s << "<a href='?action=missingpairs&prop1=25&prop2=40'>mother but not child</a>, " ;
		s << "<a href='?action=missingpairs&prop1=7&prop2=7,9'>brother but not brother/sister</a>, " ;

		s << "<form method='get' action='?' style='display:inline'><input type='hidden' name='action' value='missingpairs' />" ;
		s << "<input type='number' name='prop1' title='One property number' /><input type='text' name='prop2' title='One or more comma-separated property numbers' /><input type='submit' value='property pair' />" ;
		s << "</form>)</div>" ;


	} else if ( action == "missingpairs" ) {
		string prop_s1 = hd.params["prop1"] ;
		string prop_s2 = hd.params["prop2"] ;
		if ( prop_s2.empty() ) prop_s2 = prop_s1 ;
		TPropertyNumber p1 = atol ( prop_s1.c_str() + ((prop_s1[0]=='P'||prop_s1[0]=='p') ? 1 : 0) ) ;
		
		vector <TPropertyNumber> pl2 ;

		vector <char *> vc ;
		char buffer[BUFSIZE] ;
		strcpy ( buffer , prop_s2.c_str() ) ;
		split ( ',' , buffer , vc ) ;
		for ( uint32_t a = 0 ; a < vc.size() ; a++ ) {
			char *c = vc[a] ;
			if ( *c == 'P' ) c++ ;
			TPropertyNumber p2 = atol ( c ) ;
			if ( p2 > 0 ) pl2.push_back ( p2 ) ;
		}
		
		Tvsi res = web.getMissingPairs ( p1 , pl2 ) ;
		
		s << "<h2>Item pairs (A,B) where item A has P" << p1 << ":B, but B does not have " ;
		for ( uint32_t a = 0 ; a < pl2.size() ; a++ ) {
			if ( a > 0 ) s << "/" ;
			s << "P" << pl2[a] << ":A" ;
		}
		s << "</h2>" ;
		s << "<ol>" ;
		for ( Tvsi::iterator i = res.begin() ; i != res.end() ; i++ ) {
			s << "<li>" ;
			s << "<a target='_blank' href='//www.wikidata.org/wiki/Q" << i->item << "'>Q" << i->item << "</a>" ;
			s << " &rarr; " ;
			s << "<a target='_blank' href='//www.wikidata.org/wiki/Q" << i->value.item << "'><b>Q" << i->value.item << "</b></a>" ;
			s << "</li>" ;
		}
		s << "</ol>" ;
		

		
	} else if ( action == "doublestring" ) {
		vector <TPropertyNumber> props ;
		string prop_s = hd.params["prop"] ;
		if ( prop_s.empty() ) {
			for ( TPropertyNumber a = 0 ; a <= web.getMaxProp() ; a++ ) props.push_back ( a ) ;
		} else {
			if ( prop_s[0] == 'P' || prop_s[0] == 'p' ) props.push_back ( atol ( prop_s.c_str()+1 ) ) ;
			else props.push_back ( atol ( prop_s.c_str() ) ) ;
		}
		
		for ( TPropertyNumber p = 0 ; p < props.size() ; p++ ) {
			TPropertyNumber prop = props[p] ;
			Tmsvi res = web.getMultipleStrings ( prop ) ;
			if ( res.size() == 0 ) {
				if ( !prop_s.empty() ) s << "No double strings for property P" << prop << "!" ;
				continue ;
			}
			s << "<h2>Property <a target='_blank' href='//www.wikidata.org/wiki/Property:P" << prop << "'>P" << prop << "</a></h2>" ;
			s << "<ol>" ;
			for ( Tmsvi::iterator i = res.begin() ; i != res.end() ; i++ ) {
				s << "<li><b>" << i->first << "</b>: " ;
				for ( uint32_t a = 0 ; a < i->second.size() ; a++ ) {
					if ( a > 0 ) s << ", " ;
					s << "<a target='_blank' href='//www.wikidata.org/wiki/Q" << i->second[a] << "'>Q" << i->second[a] << "</a>" ;
				}
				s << "</li>" ;
			}
			s << "</ol>" ;
		}
	}
	
	if ( !action.empty() ) s << "<hr/><div>Done. <a href='?'>Back to stats main</a>.</div>" ;

	s << "</body></html>" ;


	
//	hd.content_type = "application/json" ;
	hd.content_type = "text/html" ;
	string t = s.str() ;
	hd.output ( t ) ;
	web.queryStatus ( -1 ) ; // Query is done
	return 1 ;
}


static int update ( httpdata &hd ) {

	string s = hd.params["sauce"] ;
	if ( s != config["secret_sauce"] ) { cerr << "Wrong password: " << s << endl ; return 1 ; }
	

	string filename = hd.params["file"] ;
	if ( filename.empty() ) { // Using binary fofn
		web.import_binary_fofn ( (hd.params["replace"]!="") ) ;
		return 1 ;
	}

	if ( hd.params["cmd"] == "write" ) {
		cout << "Writing to " << filename << endl ;
		web.writeClaims ( filename ) ;
		cout << "File written." << endl ;
		return 1 ;
	}


	cout << "Updating from " << filename << " ..." << endl ;
	
	timeval t1;
	gettimeofday(&t1, NULL);
	long m1 = ((unsigned long long)t1.tv_sec * 1000000) + t1.tv_usec;

	web.updateFromFile ( filename ) ;

	timeval t2;
	gettimeofday(&t2, NULL);
	long m2 = ((unsigned long long)t2.tv_sec * 1000000) + t2.tv_usec;

	cout << "Update took " << ((float)(m2-m1)/1000) << "ms" << endl ;

	return 1 ;
}

bool fileExists ( string filename ) {
	struct stat st_buf ;
	int status = stat (filename.c_str(), &st_buf);
	if ( status != 0 ) return false ;
	return (S_ISREG (st_buf.st_mode)) ;
}

bool dirExists ( string filename ) {
	struct stat st_buf ;
	int status = stat (filename.c_str(), &st_buf);
	if ( status != 0 ) return false ;
	return (S_ISDIR (st_buf.st_mode)) ;
}

string getCwd () {
	char *cwd = getcwd (0, 0);
	if ( !cwd ) return "" ;
	string ret ( cwd ) ;
	free ( cwd ) ;
	return ret ;
}

static int ev_handler(struct mg_connection *conn, enum mg_event ev) {
	if (ev == MG_REQUEST) {
	

		httpdata hd ;
		hd.conn = conn ;

		// TRY RETURNING FILE
		string uri = conn->uri ;
		clog << "HTTP REQUEST : " << uri << endl ;
		if ( uri[uri.length()-1] == '/' ) uri += "index.html" ;
		string filename = config["html_path"] + uri ;
		char *fn = realpath ( filename.c_str() , NULL ) ; // Path paranoia!!!
		if ( fn ) {
			filename = fn ;
			if ( filename.substr(0,config["html_path"].length()) == config["html_path"] ) {
				if ( dirExists ( filename ) ) {
					if ( filename[filename.length()-1] != '/' ) filename += "/" ;
					filename += "index.html" ;
				}
				if ( fileExists ( filename ) ) return serveFile ( hd , filename ) ;
			}
		}

		// NOT A FILE
//		mg_send_header(conn, "Content-Type", "text/plain");
//		mg_printf_data(conn, "This is a reply from server instance # %s\n%s\n\n", (char *) conn->server_param , (char*) conn->uri);

		const char *params[] = { "q","props","labels","action","prop1","prop2","prop","sauce","file","replace","cmd","callback","noitems"} ;
		
		size_t max_len = ( conn->query_string ? strlen(conn->query_string) : conn->content_len ) + 5 ;
		char *v = new char[max_len] ;
		for ( uint32_t a = 0 ; a < sizeof(params)/sizeof(char*) ; a++ ) {
			*v = 0 ;
			mg_get_var(conn, params[a], v, max_len);
			if ( *v ) {
				clog << "Parameter " << params[a] << " is " << v << endl ;
				hd.params[params[a]] = string(v) ;
			}
		}
		delete v ;


		clog << "Waiting for all-clear..." << endl ;
		while ( web.isBusy() ) usleep ( 100 * 1000 ) ; // Wait 0.1sec, try again
		web.queryStatus ( 1 ) ;
		clog << "All-clear given!" << endl ;
	
	//	cout << "URI : " << request_info->uri << endl ;

		timeval t1;
		gettimeofday(&t1, NULL);
		long m1 = ((unsigned long long)t1.tv_sec * 1000000) + t1.tv_usec;


	
		TItemQuery <TItemSet> q ;
		if ( uri == "/api" ) {
			if ( hd.params.find("q") == hd.params.end() ) {
				hd.error = "No query provided" ;
				clog << hd.error << " - http query ends" << endl ;
				return reply ( hd ) ;
			}
			if ( !q.parse ( hd.params["q"] , web ) ) {
				hd.error = "Cannot parse query: " +  hd.params["q"] ;
				clog << hd.error << " - http query ends" << endl ;
				return reply ( hd ) ;
			}
		} else if ( uri == "/stats" ) {
			clog << "Generating stats report" << endl ;
			return stats ( hd ) ;
		} else if ( uri == "/update" ) {
			clog << "Running externally triggered update. Strange." << endl ;
			return update ( hd ) ;
		} else {
			hd.error = "Don\'t know what to do" ;
			clog << hd.error << " - http query ends" << endl ;
			return reply ( hd ) ;
		}
/*		
		if ( !conn->connection_param ) {
			cout << "Round 1\n" ;
			hd.writeJSONHeader() ;
			conn->connection_param = (void*) 1 ;
			return 0 ;
		} else {
			cout << "Round 2\n" ;
			hd.header_is_written = true ;
		}
*/		

		clog << "This seems to be an actual query!" << endl ;

		hd.writeJSONHeader() ;
		

	//cout << "Query parsed : " << hd.params["q"] << endl ;
		clog << "Processing query : " << hd.params["q"] << endl ;
		q.run () ;
		clog << "Done processing query : " << hd.params["q"] << " ; processed as " << q.describe() << endl ;
	//cout << "Query run : " << hd.params["q"] << endl ;
		hd.parsed_query = q.describe() ;
	//cout << "Query described : " << hd.params["q"] << endl ;


		timeval t2;
		gettimeofday(&t2, NULL);
		long m2 = ((unsigned long long)t2.tv_sec * 1000000) + t2.tv_usec;

		hd.query_ms = ((float)(m2-m1)/1000) ;
		hd.item_num = q.result.size() ;
		if ( hd.params.find("noitems") == hd.params.end() ) {
			hd.items = q.result ;
		}
		hd.max_age = "86400" ; // 1 day
		clog << "Writing query results to output..." << endl ;
		
		int ret = reply ( hd ) ;
		
		clog << "Output written (status " << ret << ")" << endl ;
		
		return ret ;
		
	} else if (ev == MG_AUTH) {
		return MG_TRUE;
	} else {
		return MG_FALSE;
	}
}

static void *serve(void *server) {
  for (;;) mg_poll_server((struct mg_server *) server, 1000);
  return NULL;
}


void readConfigFile ( string file ) {
	config.clear() ;
	config["config_file"] = file ;
	char buf[10000] ;
	FILE *fp = fopen(file.c_str(),"r");
	if ( !fp ) {
		cerr << "Cannot open config file" << endl ;
		exit ( -1 ) ;
	}
	while (fgets(buf, sizeof buf, fp) != NULL) {
		if ( !*buf || *buf == '[' || *buf == '#' ) continue ;
		char *c ;
		for ( c = buf ; *c && *c != '=' ; c++ ) ;
		if ( !*c ) continue ;
		*c++ = 0 ;
		string key = buf ;
		char *value = c ;
		for ( c++ ; *c && *c != 39 && *c != 10 && *c != 13 ; c++ ) ;
		*c = 0 ;
		config[key] = value ;
	}
	fclose(fp);
}


#define SERVER_THREADS 50

int main ( int argc , char *argv[] ) {
	if ( argc != 2 ) {
		cerr << "Usage : " << argv[0] << " CONFIG_FILE" << endl ;
		return -1 ;
	}
	readConfigFile ( argv[1] ) ;
	if ( config["logging"] != "1" ) clog.clear(ios_base::badbit) ; // Suppresses clog
	web.is_ready = false ;
	clog << "Config file read." << endl ;
	
	
	if ( config.find("html_path") == config.end() ) {
		config["html_path"] = getCwd() + "/html/" ;
	}
	clog << "Using HTML base path " << config["html_path"] << endl ;
	
	if ( config.find("http_port") == config.end() ) config["http_port"] = "80" ;
	
	struct mg_server *server[SERVER_THREADS] ;
	char names[SERVER_THREADS][20] ;
	
	for ( uint32_t a = 0 ; a < SERVER_THREADS ; a++ ) {
		sprintf ( names[a] , "Thread %d" , a ) ;
		server[a] = mg_create_server((void *) names[a], ev_handler);
		if ( a == 0 ) {
			mg_set_option(server[a], "listening_port", config["http_port"].c_str());
//			mg_set_option(server[a],"access_log_file","access.log");
		} else {
		mg_set_listening_socket(server[a], mg_get_listening_socket(server[0]));
		}
	}

	for ( uint32_t a = 0 ; a < SERVER_THREADS ; a++ ) {
		mg_start_thread(serve, server[a]);
	}

	// Import
	web.binary_fofn = string(config["fofn"]) ;
	clog << "Importing binary file list from " << web.binary_fofn << " ..." << endl ;
	web.import_binary_fofn ( true ) ;
	clog << "Import done." << endl ;
	clog << web.getStatsString() ;

	// Forever loop
	web.is_ready = true ;
	clog << "Ready." << endl ;
	
	if ( 1 ) { // Use replica DB
		web.db = new TWikidataDB ( argv[1] , config["mysql_server"] ) ;
		web.db->batch_size = 10000 ;
		
		uint32_t cnt = 0 ;
		while ( 1 ) {
			usleep ( 1000 ) ; // Not sure why, but why not?
			clog << "Starting update cycle...\n" ;
			while ( web.db->updateRecentChanges ( web ) ) {
				clog << "One update sub-cycle finished." << endl ;
			}
			clog << "Updating done." << endl ;
			if ( config["update_wdq_file"] == "1" && ++cnt >= 2 ) { // Write out file every X updates
				clog << "Writing updates to WDQ file...\n" ;
				web.exportBinary ( web.fofn_files[0] ) ;
				clog << "WDQ file updated." << endl ;
				cnt = 0 ;
			}
			clog << "Update cycle complete." << endl ;
		}
	} else {
		while ( 1 ) usleep ( 1000*1000 ) ; // 1-sec naps
	}

	return 0 ;
}
