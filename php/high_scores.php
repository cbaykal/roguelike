<?php

$filename = "/afs/isis.unc.edu/home/b/a/baykal/public_html/roguelike/scores.txt";

if ($_POST['printResults']) {
	echo file_get_contents($filename);
} else {
	//file_put_contents($filename, $_POST['name'].','.$_POST['score'], FILE_APPEND | LOCK_EX);
	$fileHandle = fopen($filename, 'w');
	fwrite($fileHandle, $_POST['name'].','.$_POST['score']);
	fclose($fileHandle);
	echo "High score added successfully";
}

?>