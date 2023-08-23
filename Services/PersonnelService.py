from Models.Personnel import *
from flask import flash, redirect, session, url_for
from datetime import datetime


# Service class to deal with the logical operations about the personnel.

class PersonnelService:

    def __init__(self, db):
        self.db = db

    # Comparing the data provided by the candidate user with the administrator data
    def check_personnel(self, personnel):
        # Fetching authorized user from the database.
        admin = Personnel.query.filter(Personnel.role == True).first()
        # Comparing user provided inputs and valid values here.
        control = (admin.name == personnel.name) and (admin.surname == personnel.surname) and (
                admin.email == personnel.email) and (admin.department.name == personnel.department.name)
        # If user provided inputs are correct,creating session variables here and flashing messages.
        if control:
            flash(f"Welcome Back,{admin.name} {admin.surname}", "secondary")
            session["logged_in"] = True
            session["user"] = admin.name
            return True
        else:
            # Flashing error message here if provided inputs are not correct.
            flash("The information you entered is incorrect.", "danger")
            return False

    def getAllPersonnel(self):
        # Fetching all personnel from the database.
        return Personnel.query.all()

    # Fetching the personnel with the provided id value
    def getPersonnel(self, id):
        return self.preparePersonnel(Personnel.query.filter(Personnel.id == id).first())

    # Preparing the leaves of the personnel before rendering the target page.
    def preparePersonnel(self, personnel):
        leave_status = {}
        personnel.setStatus("Currently Working")
        now = datetime.strptime(datetime.now().strftime("%d/%m/%Y %H:%M"), "%d/%m/%Y %H:%M")
        total_used = 0.0
        for leave in personnel.leaves:
            total_used += leave.total_days
            start_date = datetime.strptime(leave.start_day, "%d/%m/%Y %H:%M")
            end_date = datetime.strptime(leave.end_day, "%d/%m/%Y %H:%M")

            # Deciding the status of the personnel and the leave.
            if start_date < now < end_date:
                personnel.setStatus("On Leave")
                leave_status[leave] = "Active"
            elif start_date > now and end_date > now:
                leave_status[leave] = "Unstarted"
            else:
                leave_status[leave] = "Completed"

        # Setting extra attributes of the personnel
        personnel.setTotalUsed(total_used)
        personnel.setTotalLeft(personnel.total_annual_leave - total_used)
        personnel.setLeaveTable(leave_status)

        return personnel
