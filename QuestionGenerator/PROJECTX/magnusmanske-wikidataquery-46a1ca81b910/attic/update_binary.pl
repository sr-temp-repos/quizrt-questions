#!/usr/bin/perl

# Start with "init" as parameter to refresh

use strict ;
use warnings ;
use Data::Dumper ;

my $home = '/home/magnus' ;
unless ( -e "$home/wd_tool" ) {
	$home .= '/wikidataquery' ;
}
my $marker = $home.'/updating.marker' ;
my $update_server = $home.'/update_with_claims.php' ;
my $generate_temp_xml = $home.'/generate_temp_xml.php' ;
my $wd_tool = $home.'/wd_tool' ;
#my $fofn = '/home/magnus/wikidataquery/wdq.fofn' ;
my $blobs_dir = '/data/project/wdq/blobs' ;

my $main_dumps = '/public/datasets/public/wikidatawiki' ;
$main_dumps = '/public/dumps/public/wikidatawiki' unless ( -e $main_dumps ) ;

my $incr_dumps = '/public/datasets/public/other/incr/wikidatawiki' ;
$incr_dumps = '/public/dumps/incr/wikidatawiki' unless ( -e $incr_dumps ) ;

my $tmp_dir = $home.'/tmp' ;
my $main_wdq = "$blobs_dir/merged.wdq" ;

if ( -e $marker ) {
	print "Marker $marker present, aborting.\n" ;
	exit ( 0 )  ;
}
`touch $marker` ;

my $last_time = '' ;
my $mode = $ARGV[0] || 'append' ;
my @output_files ;



$mode = 'init' unless -e $main_wdq and 0 < -s $main_wdq;
if ( $mode eq 'init' ) {
	unlink $main_wdq if -e $main_wdq ;
	update_basefiles() ;
	die "No basefiles!\n" if 0 == scalar @output_files ;
} else {
	push @output_files , $main_wdq ;
}


$last_time = get_last_time () ;
print "Updating from RC since $last_time\n" ;


my $diff_file = load_new_from_rc() ;
push @output_files , $diff_file ;

my $cmd = "$wd_tool merge " . join ( ' ' , @output_files ) . " > $main_wdq.tmp" ;
print "$cmd\n" ;
`$cmd` ;
`mv $main_wdq.tmp $main_wdq` ;
unlink $diff_file ;
`$update_server` unless $mode eq 'init' ;
unlink $marker ;








0 ;

sub get_last_time {
	my $t = '' ;
	foreach my $f ( @output_files ) {
		next unless -e $f ;
		my $s = `$wd_tool times $f` ;
		chomp $s ;
		my @a = split "\t" , $s ;
		die "No time for $f\n" unless defined $a[1] ;
		$t = $a[1] if $t lt $a[1] ;
	}
	return $t ;
}

sub load_new_from_rc {
	my $of = "$tmp_dir/$last_time.patch.xml.bz2" ;
	my $wdq = "$blobs_dir/$last_time.patch.wdq" ;
	if ( -e $wdq ) {
		print "Re-using $wdq\n" ;
		return $wdq ;
	}
	my $wdq_tmp = "$wdq.tmp1" ;
	print "Generating diff from $last_time\n" ;
	`$generate_temp_xml $last_time | bzip2 -c > $of` ;
	`bunzip2 -c $of | $wd_tool dump2bin > $wdq_tmp` ;
	`$generate_temp_xml $last_time deleted | $wd_tool removeitems $wdq_tmp > $wdq` ;
	unlink $wdq_tmp ;
	unlink $of ;
	return $wdq ;
}

sub update_basefiles {
	my @potential_files ;
	
	my $main_date ;
	foreach my $f ( `ls $blobs_dir` ) {
		next unless $f =~ m/^(\d+).main.wdq$/ ;
		$main_date = $1 ;
		last ;
	}
	
	
	# Base dump file
	my $basefile ;
	my $basedate ;
	foreach my $date ( `ls $main_dumps | sort` ) {
		chomp $date ;
		$basedate = $date ;
		$basefile = "$main_dumps/$date/wikidatawiki-$date-pages-articles.xml.bz2" ;
		die "Base dump $basefile does not exist\n" unless -e $basefile ;
	}

	if ( 1 ) {
		my $hackdate = '20140823' ;
		@potential_files = () ;
		$basefile = "/data/project/wdq/$hackdate.bz2" ; # ONETIME HACK FIXME
		push @potential_files , [ $basefile , "$blobs_dir/$hackdate.main.wdq" ] ;
	}

	die "No basefile found!\n" unless defined $basefile ;
	
	if ( $basedate < $main_date ) { # Manual, newer file
		foreach my $f ( `ls $blobs_dir` ) {
			chomp $f ;
			next if $f =~ m/\.patch\./ ;
			push @potential_files , [ "" , "$blobs_dir/$f" ] ;
			last ;
		}
		$basedate = $main_date ;
	} else {
		push @potential_files , [ $basefile , "$blobs_dir/$basedate.main.wdq" ] ;
	}
print "BASE DATE: $basedate\n" ;

	# Incremental dumps
	foreach my $date ( `ls $incr_dumps | sort` ) {
		chomp $date ;
		next if $date le $basedate ;
		my $file = "$incr_dumps/$date/wikidatawiki-$date-pages-meta-hist-incr.xml.bz2" ;
		next unless -e $file ;
		push @potential_files , [ $file , "$blobs_dir/$date.incr.wdq" ] ;
	}


	foreach my $f ( @potential_files ) {
		my ( $raw , $wdq ) = @{$f} ;
	
		if ( -e $wdq and 0 < -s $wdq ) {
			print "Re-using $wdq\n" ;
			push @output_files , $wdq ;
		} else {
			print "Generating $wdq\n" ;
			`bunzip2 -c $raw | $wd_tool dump2bin > $wdq` ;
			die "Could not create WDQ file $wdq from $raw\n" unless -e $wdq and 0 < -s $wdq ;
			push @output_files , $wdq ;
		}

	}
}
