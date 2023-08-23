from flask import render_template, request, jsonify
from Models.Personnel import Personnel
from Models.Leave import *
from Decorators.Decorators import *


class PersonnelController:
    # Binding service object here to deal with the logic operations.
    def __init__(self, personnel_service):
        self.personnel_service = personnel_service

    def index(self):
        # Rendering login page here when app first starts.
        if request.method == "GET":
            try:
                if session["logged_in"]:
                    session["logged_in"] = False
                    return render_template("login.html")
            except KeyError:
                return render_template("login.html")
        elif request.method == "POST":
            # Creating personnel object to check the provided inputs.
            personnel = Personnel(name=request.form.get("name"), surname=request.form.get("surname"),
                                  email=request.form.get("email"),
                                  department=Department(name=request.form.get("department")))
            # Checking personnel login by using service object.
            control = self.personnel_service.check_personnel(personnel)
            if control:
                # Updating session object for future control mechanisms.
                session["logged_in"] = True
                # Redirecting user to the main page of the app if user has authorization to access the system.
                return redirect(url_for("blueprint.panel"))
            # Rendering login page again if provided inputs are not correct.
            return render_template("login.html")

    @login_required
    def panel(self):
        # Rendering the panel page after fetching all personnel from the db.
        if request.method == "GET":
            all_personnel = self.personnel_service.getAllPersonnel()
            return render_template("panel.html", all_personnel=all_personnel)

    @login_required
    def leaveManagement(self, id):
        # Rendering the user specific leave management page after fetching the personnel from the db.
        if request.method == "GET":
            current_personnel = self.personnel_service.getPersonnel(id)
            return render_template("leave_management.html", current_personnel=current_personnel)

    @login_required
    def logout(self):
        # Clearing the session object and redirect user to the login page.
        try:
            session.clear()
            flash("You have successfully logged out", "secondary")
            return jsonify({"status": "success"})

        except:
            return jsonify({"status": "fail"})
