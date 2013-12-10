//var $j = jQuery.noConflict();

$(document).ready
(
	function()
	{
		var timer=null;						//global pointer to control timing events
		
		$('div.panes div#statistics').hide();			//hide the statistics pane
		
		$(document.body).bind
		(
			'offline',
			function (event)
			{
				//alert("offline");
			}
		);
		
		$('div#tabs ul li a').tap
		(
			function(e)
			{
				var target=e.target;
				var id=target.textContent.toUpperCase().trim();

				if(id=="STATISTICS")
				{
					$('div.panes div#mainview').hide();
					$('div.panes div#statistics').show();
				}
				else
				{
					$('div.panes div#mainview').show();
					$('div.panes div#statistics').hide();
				}
			}
		);
		
		$("#nettest").bind
		(
			"click",
			function(event, ui)
			{
				if (!navigator.onLine)
				{
					$('#dialogHeader').html("<h2>Network Check</h2>");
					
					var message="<h2>It seems that the browser is offline</h2>";
					message+='<a href="#" data-rel="back" data-role="button" data-icon="back">Close</a>';
					$('#dialogContent').html(message);
					$.mobile.changePage("#dialogPage",{role:"dialog"});
					return;
				}

				var start=new Date().getTime();

				$.ajax
				(
					{
						type: 'GET',
						url : 'https://dl.dropboxusercontent.com/u/15318052/LKLProjects/EclipseTATools/mobile/nettest.html',
						dataType: 'html',
						crossDomain: true,
						success : function(html, textStatus)
						{
							var bytes=html.length;
							var date=new Date();
							var time=Math.round((date.getTime()-start)/10)/100;
							var speed=Math.round(bytes/time);

							$('#dialogHeader').html("<h2>Network Check</h2>");
							
							var message="<h2>The network seems to be operational</h2>";
							message+="<p>Total time: "+time+" second<\p>";
							message+="<p>Total bytes: "+bytes+" bytes<\p>";
							message+="<p>Connection speed: "+speed+" bps<\p>";
							message+='<a href="#" data-rel="back" data-role="button" data-icon="back">Close</a>';

							$('#dialogContent').html(message);
							$.mobile.changePage("#dialogPage",{role:"dialog"});
						},
						error : function(xhr, textStatus, errorThrown) 
						{
							//alert(xhr.status);		//404
							//alert(errorThrown);		//not found
							$('#dialogHeader').html("<h2>Network Check</h2>");

							var message="<h2>There seems to be a problem with the network</h2>";
							message+='<a href="#" data-rel="back" data-role="button" data-icon="back">Close</a>';
							$('#dialogContent').html(message);
							$.mobile.changePage("#dialogPage",{role:"dialog"});
							stopService();
						}
					}
				);
			}
		);
		
		$("#start").bind
		(
			"click",
			function(event, ui)
			{
				startService();
			}
		);		

		$("#stop").bind
		(
			"click",
			function(event, ui)
			{
				stopService();
			}
		);		

		function startService()
		{
			if(timer!=null)
			{
				alert("The service is already running!");
				return;
			}
	
			//check validity of settings given
			var serviceSettings=new Object();

			if(validateServiceParameters(serviceSettings)==false)
			{
				return;
			}
		
			var interval=serviceSettings.interval;
			interval=new Number(interval);
			interval*=1000;
			updateDisplay(interval);
		}
		
		function stopService()
		{
			if(timer==null)
			{
				return;
			}
			
			clearTimeout(timer);
			timer=null;
			updateServiceStatus(false);
		}
		
		function updateServiceStatus(flag)
		{
			var status=$("input[type='text'][name='status']");	
			var statusMessage=$("input[type='text'][name='statusmessage']");

			if(flag==true)
			{
				status.val("running");
				statusMessage.val("service is running");
			}
			else
			{
				status.val("stopped");
				statusMessage.val("service is currently stopped");
			}
		}
		
		function validateServiceParameters(returnObject)
		{		
			var selected=$("input[type='text'][name='interval']");	
			var interval=selected.val().trim();
			
			if(interval.length==0)
			{
				alert("interval field cannot be empty!");
				selected.focus();
				return false;
			}
			
			interval=new Number(interval);
			
			if(isNaN(interval)==true)
			{
				alert("interval must be a numeric value!");
				selected.focus();
				return false;
			}

			if(interval<=0||interval>60)
			{
				alert("interval must be a value within the range (1-60)");
				selected.focus();
				return false;
			}
			
			returnObject.interval=interval;
			
			return true;
		}
		
		var usersDatabase=new UsersDatabase();

		function UsersDatabase()
		{
			this.data=new Array();
			this.update=function(user)
			{
				if(User.isUser(user)==false)
				{
					return;
				}
				
				var position=this.find(user);
				
				if(position==-1)
				{
					this.data[this.data.length]=user;
				}
				else
				{
					if(user.hasEvents()==true)
					{
						this.data[position].addEvent(user.events[0]);
					}
				}
			};
			this.find=function(user)
			{
				if(User.isUser(user)==false)
				{
					return -1;
				}

				var i=0;
				var found=false;
				while(i<this.data.length&&found==false)
				{
					if(this.data[i].equals(user)==true)
					{
						found=true;
					}
					else
					{
						i++;
					}
				}
				if(found==true)
				{
					return i;
				}
				else
				{
					return -1;
				}
			};
			this.toString=function()
			{
				var info="";
				
				for(var i=0;i<this.data.length;i++)
				{
					if(i!=0)
					{
						info+="-------------------\n";
					}
					info+=this.data[i].toString();
				}
				
				return info;
			};
			this.toHTMLTable=function()
			{
				var html='';
				
				for(var i=0;i<this.data.length;i++)
				{
					html+=this.data[i].toHTMLTableRow();
				}

				return html;
			};
			this.toHTMLList=function()
			{
				var html='';
				
				for(var i=0;i<this.data.length;i++)
				{
					html+=this.data[i].toHTMLListItem();
				}

				return html;
			};
			this.display=function()
			{
				alert(this.toString());
			};
		}
		
		function User(details,event)
		{
			var detailsArray=details.split("@");
			this.name=detailsArray[0];
			this.machine=detailsArray[1];
			this.events=new Array(event);
			this.addEvent=function(event)
			{
				if(this.findEvent(event)==-1)
				{
					this.events[this.events.length]=event;
				}
			};
			this.hasEvents=function()
			{
				return this.events.length>0;
			};
			this.findEvent=function(event)
			{
				var i=0;
				var found=false;
				while(i<this.events.length&&found==false)
				{
					if(this.events[i]==event)
					{
						found=true;
					}
					else
					{
						i++;
					}
				}
				if(found==true)
				{
					return i;
				}
				else
				{
					return -1;
				}
			};
			this.eventToDate=function(event)
			{
				var arrayTime=event.split(":");
				
				if(arrayTime.length!=3)
				{
					return null;
				}
				
				var today=new Date();
				var year=today.getFullYear();
				var month=today.getMonth();
				var day=today.getDate();
				var newDate=new Date(year,month,day,arrayTime[0],arrayTime[1],arrayTime[2]);
				
				return newDate;
			};
			this.equals=function(user)
			{
				if(User.isUser(user)==false)
				{
					return false;
				}
				if(this.name==user.name&&this.machine==user.machine)
				{
					return true;
				}
				return false;
			};	
			this.toString=function()
			{
				var info="";
				info+="name: "+this.name+"\n";
				info+="machine: "+this.machine+"\n";
				info+="events: "+this.events+"\n";
				return info;
			};
			this.toHTMLTableRow=function()
			{
				var html="<tr>";
				html+="<td>"+this.name+"</td>";
				html+="<td>"+this.machine+"</td>";
				html+="<td>"+this.events[this.events.length-1]+"</td>";
				html+="</tr>";
				return html;
			};
			this.toHTMLListItem=function()
			{
				var html="<li>";
				html+="<h2>"+this.name+"</h2>";
				html+="<p>"+this.machine+"</p>";
				html+="<span class='ui-li-count'>"+this.events.length+"</span>";
				html+="</li>";
				return html;
			};
			this.display=function()
			{
				alert(this.toString());
			};
		}
		
		User.getHTMLHeaders=function()
		{
			var html="<tr>";
			html+="<th data-priority='1'>name</th>";
			html+="<th data-priority='2'>machine</th>";
			html+="<th data-priority='3'>time</th>";
			html+="</tr>";
			return html;
		};
		
		User.isUser=function(user)
		{
			if(user===undefined)
			{
				return false;
			}
			if((user instanceof User)==false)
			{
				return false;
			}
			return true;
		};
		
		function processData(jsonarray)
		{
			var inactiveUsers=new UsersDatabase();
			
			for(var i=0;i<jsonarray.length;i++)
			{
				var element=jsonarray[i];
				var user=new User(element["STUDENT"],element["EVENT"]);
				inactiveUsers.update(user);
				usersDatabase.update(user);
			}
			
			$('#inactiveusersbody').html(inactiveUsers.toHTMLTable());
			$('#inactiveusers').table("refresh");
			$('#database').html(usersDatabase.toHTMLList());
			$("#database").listview("refresh");
		}

		function updateDisplay(interval)
		{
			//check validity of settings given
			var hostDetails=new Object();

			if(validateHostDetails(hostDetails)==false)
			{
				return;
			}
		
			var protocol=hostDetails.protocol;
			var host=hostDetails.host;
			var port=hostDetails.port;
			var service=hostDetails.service;
		
			var serviceURL=protocol+"://"+host+":"+port+"/"+service;

			//get the data from the server
			$.ajax
			(
				{
					type: 'GET',
					url : serviceURL,
					contentType: "application/json",
					dataType: "json",
					crossDomain: true,
					cache: false,
					success : function(html, textStatus)
					{
						updateServiceStatus(true);
						processData(html);
						timer=setTimeout(function(){updateDisplay(interval)},interval);	
					},
					error : function(xhr, textStatus, errorThrown) 
					{
						var message='Problem: the service will stop';
						alert(message);
						stopService();
					}
				}
			);
		}
		
		function validateHostDetails(returnObject)
		{
			var protocol="";
			var selected=$("input[type='radio'][name='protocol']:checked");
			if (selected.length > 0)
			{
				protocol=selected.val();
			}
			
			selected=$("input[type='text'][name='host']");	
			var host=selected.val().trim();
			
			if(host.length==0)
			{
				alert("host field cannot be empty!");
				selected.focus();
				return false;
			}
			
			selected=$("input[type='text'][name='port']");	
			var port=selected.val().trim();
			
			if(port.length==0)
			{
				alert("port field cannot be empty!");
				selected.focus();
				return false;
			}
			
			if(isNaN(new Number(port))==true)
			{
				alert("port must be a numeric value!");
				selected.focus();
				return false;
			}
			
			selected=$("input[type='text'][name='service']");	
			var service=selected.val().trim();

			if(service.length==0)
			{
				alert("service field cannot be empty!");
				selected.focus();
				return false;
			}
			
			returnObject.protocol=protocol;
			returnObject.host=host;
			returnObject.port=port;
			returnObject.service=service;
			
			return true;
		}
		
		$("#hosttest").bind
		(
			"click",
			function(event, ui)
			{
				var hostDetails=new Object();

				if(validateHostDetails(hostDetails)==false)
				{
					return;
				}
			
				var protocol=hostDetails.protocol;
				var host=hostDetails.host;
				var port=hostDetails.port;
				var service=hostDetails.service;
			
				var serviceURL=protocol+"://"+host+":"+port+"/"+service;
				var start=new Date().getTime();
				
				$.ajax
				(
					{
						type: 'GET',
						url : serviceURL,
						contentType: "application/json",
						dataType: "json",
						crossDomain: true,
						cache: false,
						success : function(html, textStatus)
						{
							var bytes=html.length;
							var date=new Date();
							var time=Math.round((date.getTime()-start)/10)/100;
							var speed=Math.round(bytes/time);

							$('#dialogHeader').html("<h2>Host Check</h2>");
							
							var message="<h2>The host seems to be available</h2>";
							message+="<p>Total time: "+time+" second<\p>";
							message+="<p>Total bytes: "+bytes+" bytes<\p>";
							message+="<p>Connection speed: "+speed+" bps<\p>";
							message+='<a href="#" data-rel="back" data-role="button" data-icon="back">Close</a>';

							$('#dialogContent').html(message);
							$.mobile.changePage("#dialogPage",{role:"dialog"});
						},
						error : function(xhr, textStatus, errorThrown) 
						{
							//alert(xhr.status);		//404
							//alert(errorThrown);		//not found
							$('#dialogHeader').html("<h2>Host Check</h2>");

							var message="<h2>There seems to be a problem with the host</h2>";
							message+='<p>Error reported:'+(errorThrown?errorThrown:xhr.status)+'</p>';
							message+='<a href="#" data-rel="back" data-role="button" data-icon="back">Close</a>';
							$('#dialogContent').html(message);
							$.mobile.changePage("#dialogPage",{role:"dialog"});
							stopService();
						}
					}
				);
			}
		);
	}
);