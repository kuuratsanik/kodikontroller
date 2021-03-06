// KodiKontroller init functions



$(function() {

    // Build the individual interfaces
    var interface_holder = $('section.screens');
    var interface_template = $('article.screen#template');
    var interface_counter = 0;

    var interface_groups = {};

	
	
    // Hide the template
    interface_template.detach();

    
    // Create interfaces from config array
    for (var i in screen_list) {

        interface_groups[screen_list[i].group] = true;

        var new_screen = interface_template.clone();

        new_screen.css({opacity:0});

        new_screen.removeAttr('id');
        new_screen.data('kodi-target', screen_list[i].host);
        new_screen.data('kodi-group', screen_list[i].group);
        new_screen.find('h2').text(screen_list[i].name);

        new_screen.appendTo(interface_holder);
        new_screen.delay(100*interface_counter++).animate({opacity:1}, 300, 'easeOutSine');
        
    }


    // Normalise interface_groups into simple array
    var temp_groups = [];
    for (var group in interface_groups) {
        if (interface_groups.hasOwnProperty(group)) {
            temp_groups.push(group);
        }
    }
    interface_groups = temp_groups;


    // Set up logging function
    var log = function( msg ) {
        var output = $('[name="response"]');
        output.val( output.val() + msg );
        if(output.length) {
            output.scrollTop(output[0].scrollHeight - output.height());
        }
    };


    // Add actions to all buttons
    $( 'button' ).each( function() {

        var $this = $(this);
        
        
        $this.click( function() {

            var screen = $this.parent();

            // Walk up the DOM if screen doesn't have a data-kodi-target attribute
            while (typeof screen.data('kodi-target') === 'undefined') {
                screen = screen.parent();
            }
        
            var kodi_address = screen.data('kodi-target');
            var kodi_action  = $this.data('kodi-action');
            var screen_name  = screen.find('h2').text();
            var screen_group = screen.data('kodi-group');
            
            var url = screen.find('[name="url"]')[0].value;
            var message = screen.find('[name="message"]')[0].value;
            
            var rpc_data = '';
            
            
            // Create a timestamp
            // (OMFG JS Date formatting sucks...)
            var timestamp = new Date();
            var timestamp_human = ("0"+(timestamp.getDate()+1)).slice(-2) + '/' + ("0"+(timestamp.getMonth()+1)).slice(-2) + '/' + timestamp.getFullYear()
                + ' ' + ("0" + timestamp.getHours()).slice(-2) + ':' + ("0"+timestamp.getMinutes()).slice(-2) + ':' + ("0"+timestamp.getSeconds()).slice(-2);
                
            // Add the timestamp and screen name to the output log
            log('[' + timestamp_human + '] ' + '<' + screen_name + '> : ');     
            
            switch (kodi_action) {
                
                case 'play':
                
                    if (url === '') {
                        // Exit if url is empty
                        // TODO: validate url
                        log("Error: No URL supplied\n");
                        break;
                    }

                    // Prepare regex var
                    var re;

                    // Handle youtube URLs
                    // TODO generalize and include playlists, youtu.be URLs
                    if (url.search('youtube.com') !== -1) {
                        re = /v=[^&$]*/i;
                        var ytid = url.match(re)[0].substr(2);
                        url = 'plugin://plugin.video.youtube/play/?video_id=' + ytid;
                    }

                    // Handle vimeo URLs
                    // TODO all the things.
                    // https://vimeo.com/xxxxxxxx -> plugin://plugin.video.vimeo/play/?video_id=xxxxxxxx
                    if (url.search('vimeo.com') !== -1) {
                       re = /vimeo\.com\/[^&$]*/i;
                       var vimid = url.match(re)[0].substr(10);
                       url = 'plugin://plugin.video.vimeo/play/?video_id=' + vimid;
                    }
                    

                    // Handle SAMBA shares
                    log("Sending URL \"" + url + "\" ... ");
                    
                    // Set the RPC data variable
                    rpc_data = 'request=' + encodeURIComponent( '{"jsonrpc":"2.0","method":"Player.Open","params":{"item":{"file":"' + url + '"}},"id":"1"}' );
                    
                    break;
                
                
                case 'notify':
                
                    if (message === '') {
                        // Exit if message is empty
                        // TODO: escape/check message
                        log("Error: No message supplied\n");
                        break;
                    }
                    
                    log("Sending message \"" + message + "\" ... ");
                    
                    // Set the RPC data variable
                    rpc_data= 'request=' + encodeURIComponent( '{"jsonrpc":"2.0","id":"1","method":"GUI.ShowNotification","params":{"title":"Notification","message":"' + message + '","displaytime":20000}}' );

                    break;
                
                case 'reset' :


                    log("Rebooting Instance ... ");

                    rpc_data= 'request=' + encodeURIComponent( '{"jsonrpc":"2.0","id":"1","method":"System.Reboot"}' );
                    
                    break;
                
				case 'stats' :


					log("Loading general stats and KPIs");
					
					rpc_data= 'request=' + encodeURIComponent( '{"jsonrpc":"2.0","id":"2","method":"Player.Open","params":{"item":{"directory":"smb://EMBASSY-NAS/photo/"}}}' );
					
					break;

				case 'social' :


					log("Loading web, digital & social content...");
					
					rpc_data= 'request=' + encodeURIComponent( '{"jsonrpc":"2.0","id":"2","method":"Player.Open","params":{"item":{"directory":"smb://EMBASSY-NAS/photo/"}}}' );
					
					break;
					
				case 'technical' :


					log("Loading technical dashboards...");
					
					rpc_data= 'request=' + encodeURIComponent( '{"jsonrpc":"2.0","id":"2","method":"Player.Open","params":{"item":{"directory":"smb://EMBASSY-NAS/photo/"}}}' );
					
					break;

				case 'cec-activate' :

					// This function requires the Kodi JSON-CEC Plugin from https://github.com/joshjowen/script.json-cec
					// Tested and working well.

					log("Display On ... ");
					
					rpc_data= 'request=' + encodeURIComponent( '{"jsonrpc":"2.0","method":"Addons.ExecuteAddon","params":{"addonid":"script.json-cec","params":{"command":"activate"}},"id":1}' );
					
					break;

				case 'cec-standby' :

					// This function requires the Kodi JSON-CEC Plugin from https://github.com/joshjowen/script.json-cec
					// Tested and working well.
					log("Display Off ... ");
					
					rpc_data= 'request=' + encodeURIComponent( '{"jsonrpc":"2.0","method":"Addons.ExecuteAddon","params":{"addonid":"script.json-cec","params":{"command":"standby"}},"id":1}' );
					
					break;					

                case 'img-notify-bottom' :
                
                    // This function requires the Kodi Banners Addon from http://kodi.lanik.org/banners.html
                    // Tested and working well.
                    log("Image Notification Sent ... ");
                    
                    rpc_data= 'request=' + encodeURIComponent( '{"jsonrpc":"2.0","method":"Addons.ExecuteAddon","params":{"addonid":"service.lowerthird","params":{"imageloc":"smb://10.20.0.241/kodi-kontroller/gfx/alert-statuscake.jpg","displaytime":"45000","position":"bottom"}},"id":1}' );
                    
                    break;
				
                case 'img-notify-cent' :
                
                    // This function requires the Kodi Banners Addon from http://kodi.lanik.org/banners.html
                    // Tested and working well.
                    log("Image Notification Sent ... ");
                    
                    rpc_data= 'request=' + encodeURIComponent( '{"jsonrpc":"2.0","method":"Addons.ExecuteAddon","params":{"addonid":"service.lowerthird","params":{"imageloc":"D:\\img.jpg","displaytime":"45000","position":"center"}},"id":1}' );
                    
                    break;
				
				case 'img-notify-top' :
                
                    // This function requires the Kodi Banners Addon from http://kodi.lanik.org/banners.html
                    // Tested and working well.
                    log("Image Notification Sent ... ");
                    
                    rpc_data= 'request=' + encodeURIComponent( '{"jsonrpc":"2.0","method":"Addons.ExecuteAddon","params":{"addonid":"service.lowerthird","params":{"imageloc":"D:\\img.jpg","displaytime":"45000","position":"top"}},"id":1}' );
                    
                    break;
					
				case 'set-screen-on-time' :
					$(document).ready(function(){
					$('input.timepicker').timepicker({
					timeFormat: 'HH:mm:ss',
					// year, month, day and seconds are not important
					minTime: new Date(0, 0, 0, 8, 0, 0),
					maxTime: new Date(0, 0, 0, 19, 0, 0),
					// time entries start being generated at 8AM but the plugin 
					// shows only those within the [minTime, maxTime] interval
					startHour: 8,
					// the value of the first item in the dropdown, when the input
					// field is empty. This overrides the startHour and startMinute 
					// options
					startTime: new Date(0, 0, 0, 8, 00, 0),
					// items in the dropdown are separated by at interval minutes
					interval: 30,
					defaultTime: 8
					});
					});
					break;

				case 'set-screen-off-time' :
					$(document).ready(function(){
					$('input.timepicker').timepicker({
					timeFormat: 'HH:mm:ss',
					// year, month, day and seconds are not important
					minTime: new Date(0, 0, 0, 8, 0, 0),
					maxTime: new Date(0, 0, 0, 19, 0, 0),
					// time entries start being generated at 8AM but the plugin 
					// shows only those within the [minTime, maxTime] interval
					startHour: 8,
					// the value of the first item in the dropdown, when the input
					// field is empty. This overrides the startHour and startMinute 
					// options
					startTime: new Date(0, 0, 0, 8, 00, 0),
					// items in the dropdown are separated by at interval minutes
					interval: 30,
					defaultTime: 18
					});
					});
					break;
				
                default:
                
                    // Not a recognised action
                    log("Error: unknown action\n");
                    
            }
            
            
            
            // Send the AJAX XHR if rpc_data variable is not the empty string
            if (rpc_data !== '') {
            
                $.ajax({
                    url: kodi_address + '/jsonrpc',
                    dataType: 'jsonp',
                    jsonpCallback: 'jsonCallback',
                    type: 'GET',
                    async: true,
                    timeout: 10000,
                    data: rpc_data
                })
                
                // If Success, Notify User
                .done( function( data, textStatus, jqXHR ) {
                    if ( jqXHR.status == 200 && data['result'] == 'OK' ) {
                        log("Done\n");
                    } else {
                        log("Error\n");
                    }
                })
                
                // Older Versions Of Kodi/XBMC Tend To Fail Due To CORS But Typically If A '200' Is Returned Then It Has Worked!
                .fail( function( jqXHR, textStatus ) {
                    if ( jqXHR.status == 200 ) {
                        log("Done\n" );
                    } else {
                        log("Error: " + textStatus + "\n" );
                    }
                });
            
            }                
        })
    });
});
