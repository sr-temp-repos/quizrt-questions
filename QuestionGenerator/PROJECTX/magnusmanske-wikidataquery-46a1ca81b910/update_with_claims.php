#!/usr/bin/php
<?PHP

ini_set('default_socket_timeout',5*60);  // Patience, my dear padawan...

#if ( !isset ( $argv[1] ) ) {
#	die ( "Needs gzip'ed claim file as parameter\n" ) ;
#}

$sauce = trim ( file_get_contents ( "secretsauce.txt" ) ) ;
$port = trim ( file_get_contents ( "port.txt" ) ) ;
$url = "http://localhost:$port/update?sauce=$sauce&replace=1" ;

/*
if ( isset ( $argv[1] ) ) {
	$file = $argv[1] ;
	$tmpfile = "$file.tmp" ;
	@unlink ( $tmpfile ) ;
	exec ( "gunzip -c $file > $tmpfile" ) ;
	$url .= "&file=" . urlencode ( $tmpfile ) ;
}
*/

@file_get_contents ( $url ) ;

//if ( isset ( $tmpfile ) ) @unlink ( $tmpfile ) ;

?>