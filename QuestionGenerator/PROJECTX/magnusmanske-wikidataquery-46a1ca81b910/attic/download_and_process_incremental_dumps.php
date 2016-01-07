#!/usr/bin/php
<?PHP

date_default_timezone_set ( "America/Los_Angeles" ) ;

$dir = 'claims' ;
$start_date = '' ;
if ( !isset ( $argv[1] ) ) {
	if ($handle = opendir($dir)) {
		while (false !== ($entry = readdir($handle))) {
			if ( !preg_match ( '/^(\d+)\.gz$/i' , $entry , $m ) ) continue ;
			$start_date = $m[1] * 1 ;
			break ;
		}
	}
	if ( $start_date == '' ) {
		print "Needs start date (YYYYMMDD) as parameter\n" ;
		exit ( 0 ) ;
	}
} else {
	$start_date = $argv[1] * 1 ;
}

$end_date = date ( "Ymd" ) * 1 - 1 ;

for ( $d = $start_date ; $d <= $end_date ; $d++ ) {
	print "$d..." ;
	$claims = "$dir/$d.gz" ;
	if ( file_exists ( $claims ) ) {
		print "exists, " ;
	} else {
	
		$dump = "/public/datasets/public/other/incr/wikidatawiki/$d/wikidatawiki-$d-pages-meta-hist-incr.xml.bz2" ;
		if ( !file_exists ( $dump ) ) {
			print "File $dump does not exist, skipping...\n" ;
			continue ;
		}

		print "processing..." ;
		$cmd = "bunzip2 -c $dump | ./parse_xml_bz2.php | gzip -c > $claims" ;
		exec ( $cmd ) ;
//		unlink ( $dump ) ;
	}
	
	if ( $d == $start_date ) {
		print "seed file, not updating.\n" ;
		continue ;
	}

	print "updating..." ;
	$cmd = "./update_with_claims.php $claims" ;
	exec ( $cmd ) ;
	
	print " Up-to-date.\n" ;
}

?>
