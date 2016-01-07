#!/usr/bin/php
<?PHP

// S=string; T=time; C=coordinate; no letter=item

$title = '' ;
$ns = '' ;
$last_text = '' ;
while ( !feof ( STDIN ) ) {
	$line = trim(fgets(STDIN));
	if ( preg_match ( '/<title>Q(.+)<\/title>/' , $line , $m ) ) $title = $m[1] ;
	else if ( preg_match ( '/<title>Property:(P.+)<\/title>/' , $line , $m ) ) $title = $m[1] ;
	else if ( preg_match ( '/<ns>(.+)<\/ns>/' , $line , $m ) ) $ns = $m[1] ;
	else if ( ( $ns == 0 || $ns == 120 ) && preg_match ( '/<text .+?>(.*)<\/text>/' , $line , $m ) ) $last_text = $m[1] ;
	else if ( preg_match ( '/<\/page>/' , $line , $m ) and $last_text != '' ) {
		$json = json_decode ( html_entity_decode ( $last_text ) ) ;
		$last_text = '' ;
		if ( isset ( $json->label ) ) {
			foreach ( $json->label AS $wiki => $text ) {
				print "$title\tL:$wiki\t$text\n" ;
			}
		}
		if ( $ns == 0 && isset ( $json->claims ) ) { // Items only
			foreach ( $json->claims AS $v ) {
				if ( isset ( $v->m[3]->{'numeric-id'} ) ) {
					$s = "$title\t" . $v->m[1] . "\t" . $v->m[3]->{'numeric-id'} . "\n" ; ;
					print $s ;
				} else if ( isset ( $v->m[2] ) and $v->m[2] == 'bad' ) {
					// Ignore
				} else if ( isset ( $v->m[2] ) and $v->m[2] == 'string' ) {
					$s = "$title\t" . $v->m[1] . "\tS" . trim($v->m[3]) . "\n" ; ;
					print $s ;
				} else if ( isset ( $v->m[2] ) and $v->m[2] == 'time' ) {
					$s = "$title\t" . $v->m[1] . "\tT" ;
					$s .= '|' . trim($v->m[3]->time) ;
					$s .= '|' . trim($v->m[3]->timezone) ;
					$s .= '|' . trim($v->m[3]->before) ;
					$s .= '|' . trim($v->m[3]->after) ;
					$s .= '|' . trim($v->m[3]->precision) ;
					$s .= '|' . trim(preg_replace('/^.+\/Q/','',$v->m[3]->calendarmodel)) ; // Item ID
					$s .= "\n" ;
					print $s ;
				} else if ( isset ( $v->m[2] ) and $v->m[2] == 'globecoordinate' ) {
					$s = "$title\t" . $v->m[1] . "\tC" ;
					$s .= '|' . trim($v->m[3]->latitude) ;
					$s .= '|' . trim($v->m[3]->longitude) ;
					$s .= '|' . trim($v->m[3]->altitude) ;
					$s .= '|' . trim($v->m[3]->precision) ;
					$s .= '|' . trim(preg_replace('/^.+\/Q/','',$v->m[3]->globe)) ; // Item ID
					$s .= "\n" ;
					print $s ;
				} else if ( $v->m[0] == 'novalue' ) {
					$s = "$title\t" . $v->m[1] . "\t4294967295\n" ; // MAX_UINT32-1
					print $s ;
				} else if ( $v->m[0] == 'somevalue' ) {
					$s = "$title\t" . $v->m[1] . "\t4294967294\n" ; // MAX_UINT32-2
					print $s ;
				} else {
					fwrite ( STDERR , json_encode ( $v )."\n" ) ; // STDERR mismatching claim
				}
			}
		}
	}
}

?>
