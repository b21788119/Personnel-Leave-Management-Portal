from flask import render_template, request, jsonify
from Models.Leave import *
from Decorators.Decorators import *


class LeaveController:
    # Binding service object here to deal with the logic operations.
    def __init__(self, leave_service):
        self.leave_service = leave_service

    @login_required
    def addNewLeave(self, id):
        # Creating leave object using the form fields.
        new_leave = Leave(start_day=request.form.get("start") + " " + request.form.get("hour"),
                          end_day=request.form.get("end") + " " + request.form.get("hour2"), owner=id,
                          total_days=request.form.get("total_days"))
        # Pass the leave object to the service to be inserted to the db.
        if self.leave_service.addLeave(new_leave):
            return jsonify(
                {"status": "success", "increment_value": new_leave.id, "leave_status": new_leave.getStatus()})
        return jsonify({"status": "fail"})

    @login_required
    def updateLeave(self, id_personnel, id_leave):
        # Fetching the leave object before updating it.
        updated_leave = self.leave_service.getLeave(id_leave)
        # Pass the form fields and leave to be updated to the update function of the service.
        if self.leave_service.updateLeave(updated_leave, request.form.get("start") + " " + request.form.get("hour"),
                                          request.form.get("end") + " " + request.form.get("hour2"),
                                          request.form.get("total_day_request")):
            return jsonify({"status": "success", "leave_status": updated_leave.getStatus()})
        return jsonify({"status": "fail"})

    @login_required
    def deleteLeave(self, id_personnel, id_leave):
        # Fetching the leave object to be deleted using the provided id value.
        deleted_leave = self.leave_service.getLeave(id_leave)
        # Passing the leave to be deleted to the delete function of the service.
        if self.leave_service.deleteLeave(deleted_leave):
            return jsonify({"status": "success"})
        return jsonify({"status": "fail"})
