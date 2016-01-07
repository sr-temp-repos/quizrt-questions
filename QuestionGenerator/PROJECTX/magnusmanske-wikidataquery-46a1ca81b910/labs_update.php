#!/usr/bin/php
<?PHP

$wdq_base_file = '/data/project/wdq/blobs/merged.wdq' ;

function readDeleteItems () {
	global $tools_wmflabs , $todel ;
	if ( file_exists ( $todel ) ) unlink ( $todel ) ;
	$last_day = preg_replace ( '/[+-]\d+:\d+/' , 'Z' , date ( 'c' , time()-(24*60*60*2) ) ) ;
	$url = $tools_wmflabs."/wikidata-todo/last_changed_items.php?deleted=1&date=$last_day" ;
	$item_list = file_get_contents ( $url ) ;
	$item_list = json_decode ( $item_list ) ;
//	$item_list = explode ( '","' , $item_list ) ;
	$out = fopen ( $todel , 'w' ) ;
	fwrite ( $out , implode ( "\n" , $item_list ) ) ;
	fclose ( $out ) ;
}

$testing = false ;
$max_hours_batch = 10 ;
$wdq_update_file = "$wdq_base_file.update.wdq" ;
$home = '/home/magnus/wikidataquery' ;
$wd_tool = "$home/wd_tool" ;
$update_claims = "$home/update_with_claims.php" ;
$updating_marker = "$home/updating.marker" ;
$tools_wmflabs = 'http://10.68.16.4' ;
$run_hours = 10 ;

if ( !$testing ) {
	if ( file_exists ( $updating_marker ) ) exit ( 0 ) ;
	touch ( $updating_marker ) ;
}

//error_reporting(E_ERROR|E_CORE_ERROR|E_ALL|E_COMPILE_ERROR);
//ini_set('display_errors', 'On');
ini_set('memory_limit','2500M');
set_time_limit ( 60 * 60 * $run_hours ) ;
ini_set('user_agent','WikidataQuery updater'); # Fake user agent

// Init
$wdq_tmp_file = "$wdq_base_file.tmp" ;
if ( file_exists ( $wdq_update_file ) ) unlink ( $wdq_update_file ) ;
if ( file_exists ( $wdq_tmp_file ) ) unlink ( $wdq_tmp_file ) ;
$cmd = "$wd_tool times '$wdq_base_file'" ;
$s = exec ( $cmd ) ;
$s = explode ( "\t" , $s ) ;
$last_date = array_pop ( $s ) ;
$current_date = preg_replace ( '/[+-]\d+:\d+/' , 'Z' , date ( 'c' ) ) ;

// Get list of changed items since "end" of last file

$use_end_date = 0 ;
$d0 = strtotime ( $last_date ) ;
$d1 = strtotime ( $current_date ) ;
$diff = $d1 - $d0 ;

if ( $diff / 3600 > $max_hours_batch ) {
	$d1 = $d0 + $max_hours_batch * 3600 ;
	$current_date = preg_replace ( '/[+-]\d+:\d+/' , 'Z' , date ( 'c' , $d1 ) ) ;
	$use_end_date = 1 ;
}

$url = $tools_wmflabs."/wikidata-todo/last_changed_items.php?date=$last_date" ;
if ( $use_end_date ) $url .= "&until=$current_date" ;
if ( $testing ) $item_list = '["Q12345","Q1","Q2"]' ;
else $item_list = file_get_contents ( $url ) ;
$item_list = explode ( '","' , $item_list ) ;

// Pipe JSON of changed items into new wdq file
if ( $testing ) $pipe = "cat > /home/magnus/wikidataquery/test1.json" ;
else $pipe = "$wd_tool json2bin $current_date 2>&1 > '$wdq_update_file'" ;
$out = popen ( $pipe , 'w' ) ;
fwrite ( $out , "[\n" ) ;

$first = true ;
$chunks = array_chunk ( $item_list , 50 ) ;

foreach ( $chunks AS $chunk ) {
	$url = "https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&redirects=no&ids=" ;
	foreach ( $chunk AS $k => $v ) {
		if ( $k > 0 ) $url .= '|' ;
		$url .= "Q" . preg_replace ( '/\D/' , '' , $v ) ;
	}
	$j = file_get_contents ( $url ) ;
	if ( !$j || $j == '' ) continue ; // Error
	$j = json_decode ( $j  );
	if ( !isset ( $j->entities ) ) continue ;
	foreach ( $j->entities AS $q => $v ) {
		if ( $first ) $first = false ;
		else fwrite ( $out , ",\n" ) ;
		fwrite ( $out , json_encode ( $v ) ) ;
	}
}

/*
foreach ( $item_list AS $k => $q ) {
	if ( !$first ) fwrite ( $out , ",\n" ) ;
	else $first = false ;
	$q = 'Q'.preg_replace ( '/\D/' , '' , $q ) ;
	$url = "http://www.wikidata.org/wiki/Special:EntityData/$q.json" ;
	$j = file_get_contents ( $url ) ;
	if ( !$j || $j == '' ) continue ; // Error
	$j = json_decode ( $j ) ;
	if ( !isset ( $j->entities ) ) continue ;
	if ( !isset ( $j->entities->$q ) ) continue ;
	fwrite ( $out , json_encode ( $j->entities->$q ) ) ;
}
*/

fwrite ( $out , "\n]" ) ;
pclose ( $out ) ;

// Now merge the old file and the new file into a temporary file
$cmd = "$wd_tool merge '$wdq_base_file' '$wdq_update_file' > '$wdq_tmp_file'" ;
exec ( $cmd ) ;

$todel = "$wdq_tmp_file.del" ;
if ( !$testing and filesize ( $wdq_tmp_file ) >= 0.9 * filesize ( $wdq_base_file ) ) { // Success heuristic
	readDeleteItems () ;
	if ( file_exists ( $todel ) ) {
		$cmd = "cat $todel | $wd_tool removeitems $wdq_tmp_file" ;
		print "$cmd\n" ;
		exec ( $cmd ) ;
	}
	unlink ( $wdq_base_file ) ;
	rename ( $wdq_tmp_file , $wdq_base_file ) ;
	exec ( $update_claims ) ;
}

if ( file_exists ( $wdq_update_file ) ) unlink ( $wdq_update_file ) ;
if ( file_exists ( $wdq_tmp_file ) ) unlink ( $wdq_tmp_file ) ;
#if ( file_exists ( $todel ) ) unlink ( $todel ) ;
unlink ( $updating_marker ) ;

?>
