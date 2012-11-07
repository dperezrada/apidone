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
		'urlRoot': 'http://localhost:3000/accounts'
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
					console.log("hola");
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
			$.ajax({
			  url: 'http://localhost:3000/subdomains',
			  type: 'POST',
			  dataType: 'json',
			  data: {subdomain: $(e.target).val()},
			  complete: function(xhr, textStatus) {
			    var json = JSON.parse(xhr.responseText);
			    var color = "red"
			    if(json.status == "Available"){
			    	color = "green";
			    }
				$(".status_subdomain").text(json.status).css("color", color);;
			  }
			});
			
		}
	});

	App.Instances.RegisterView = new App.Views.Register();

});