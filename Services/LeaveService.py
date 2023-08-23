from Models.Leave import *
from datetime import datetime

# Service class for dealing with the logic of the leave operations.
class LeaveService:

    def __init__(self,db):
        self.db = db

    # Fetching the leave object with the provided id value
    def getLeave(self, id):
        return Leave.query.filter(Leave.id == id).first()

    # Deleting the leave object from the database
    def deleteLeave(self,leave):
        try:
            self.db.session.delete(leave)
            self.db.session.commit()
            return True
        except:
            return False

    # Updating the leave object and corresponding database table here.
    def updateLeave(self,leave, start_date, end_date, total_days):
        try:
            leave.start_day = start_date
            leave.end_day = end_date
            leave.total_days = total_days
            self.db.session.commit()
            self.setLeaveStatus(leave)
            return True
        except:
            return False

    # Adding newly created leave object to the database here.
    def addLeave(self, new_leave):
        try:
            self.db.session.add(new_leave)
            self.db.session.commit()
            self.setLeaveStatus(new_leave)
            return True
        except:
            return False

    # Deciding and the setting the status of the newly created leave object.
    def setLeaveStatus(self, leave):
        now = datetime.strptime(datetime.now().strftime("%d/%m/%Y %H:%M"), "%d/%m/%Y %H:%M")
        start_date = datetime.strptime(leave.start_day, "%d/%m/%Y %H:%M")
        end_date = datetime.strptime(leave.end_day, "%d/%m/%Y %H:%M")
        if start_date < now < end_date:
            leave.setStatus("Active")
        elif start_date > now and end_date > now:
            leave.setStatus("Unstarted")
        else:
            leave.setStatus("Completed")
