from flask import Flask, render_template
from Routes.Route import Route
from DB.DBObject import db
from Models.Leave import *
from Controllers.PersonnelController import PersonnelController
from Controllers.LeaveController import LeaveController
from Services.PersonnelService import PersonnelService
from Services.LeaveService import LeaveService


# Function to create app object and make necessary configurations
def createApp():
    app = Flask(__name__, template_folder="View")
    app.config.from_object('config')
    db.init_app(app)
    personnel_controller = PersonnelController(PersonnelService(db))
    leave_controller = LeaveController(LeaveService(db))
    blueprint = Route(personnel_controller, leave_controller)
    app.register_blueprint(blueprint.getRoutes(), url_prefix='/')
    return app


# Creating app object
app = createApp()

# Creating model tables if they do not exist
with app.app_context():
    db.create_all()

# Running the server here
if __name__ == '__main__':
    app.run()
