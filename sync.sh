#!/usr/bin/env sh

lftp <<SCRIPT
	open -p 21 ftpupload.net;
	login b24_32036744 $FTP_PASS;
	cd balt.sno.mba;
	rm -r htdocs
	mirror -P 8 -R --delete-first -x .git -X .git* -X *.sublime* -X sync.sh . htdocs
SCRIPT

exit 0
