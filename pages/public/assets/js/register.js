$(document).ready(function(){
	var App = {
		Models: {},
		Collections: {},
		Views: {},
		Instances: {},
		Variables: {},
	}

	// Models
	App.Models.Account = Backbone.Model.extend({
		'urlRoot': BASE_URL+'/accounts'
	});

	App.Views.Register = Backbone.View.extend({
		el: '#register',
		template: _.template($('#tpl-register').html()),

		events: {
			"click #register-button": "create",
			"change #inputSubdomain": "check_subdomain"
		},

		initialize: function() {
			$(this.el).html("");
			var data = {
				'subdomain': '',
				'pass': '',
				'email': '',
				'err': ''
			}
			this.render(data);
		},

		render: function(data) {
			$(this.el).html(this.template(data));
		},

		create: function(model) {
			var self = this;
			var data = {
				'subdomain': $("#inputSubdomain").val(),
				'pass': $("#inputPassword").val(),
				'email': $("#inputEmail").val()
			}
			this.loading();
			account = new App.Models.Account(data);
			account.save({}, {
				complete: function(xhr, response_status){
					var json = JSON.parse(xhr.responseText);
					error = "";
					a = xhr;
					if(xhr.status == 201){
						var template = _.template($('#tpl-success').html());
						$(self.el).html(template({'subdomain': json.id}));
					}else if(xhr.status == 409){
						data['err'] = json.err;
						self.render(data);
					} 
					
				}
			});
			return false;
		},
		loading: function(){
			$(this.el).html(_.template($('#tpl-loading').html()));
		},
		check_subdomain: function(e){
			var subdomain = $(e.target).val();
			if(subdomain.length<6){
				$(".status_subdomain").text("Must have length of 6 or more").css("color", "red");;
			}else{
				$(".status_subdomain").text("");
				$.ajax({
				  url: BASE_URL+'/subdomains',
				  type: 'POST',
				  dataType: 'json',
				  data: {subdomain: subdomain},
				  complete: function(xhr, textStatus) {
				    var json = JSON.parse(xhr.responseText);
				    var color = "red"
				    if(json.status == "Available"){
				    	color = "green";
				    }
				    a = json;
					$(".status_subdomain").text(json.status).css("color", color);
				  }
				});
			}
			
		}
	});

	App.Instances.RegisterView = new App.Views.Register();

});