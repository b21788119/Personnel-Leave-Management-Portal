from flask import Blueprint


class Route:
    def __init__(self, personnel_controller, leave_controller):
        # Creating a blueprint object in order to control user requests and corresponding controller actions.
        self.blueprint = Blueprint('blueprint', __name__)
        self.prepareRoutes(personnel_controller, leave_controller)

    # Creating routes and binding the necessary controller actions here.
    def prepareRoutes(self, personnel_controller, leave_controller):
        self.blueprint.route('/', methods=['GET', 'POST'])(personnel_controller.index)
        self.blueprint.route('/logout', methods=['GET'])(personnel_controller.logout)
        self.blueprint.route('/panel', methods=['GET', 'POST'])(personnel_controller.panel)
        self.blueprint.route('/leaveManagement/<string:id>', methods=['GET'])(personnel_controller.leaveManagement)
        self.blueprint.route('/leaveManagement/<string:id>/add', methods=['POST'])(leave_controller.addNewLeave)
        self.blueprint.route('/leaveManagement/<string:id_personnel>/update/<string:id_leave>', methods=['POST'])(
            leave_controller.updateLeave)
        self.blueprint.route('leaveManagement/<string:id_personnel>/delete/<string:id_leave>', methods=['POST'])(
            leave_controller.deleteLeave)

    def getRoutes(self):
        return self.blueprint
