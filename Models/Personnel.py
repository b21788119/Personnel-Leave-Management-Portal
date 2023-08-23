from Models.Department import *


# Personnel Model

class Personnel(db.Model):
    __tablename__ = 'personnel'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100))
    surname = db.Column(db.String(100))
    email = db.Column(db.String(100))
    department_id = db.Column(db.Integer, db.ForeignKey('department.id'))
    department = db.relationship('Department',back_populates = "personnel")
    total_annual_leave = db.Column(db.Double)
    role = db.Column(db.Boolean)
    leaves = db.relationship('Leave', backref='Personnel')
    __status = None
    __totalUsed = -1
    __totalLeft = -1
    __leaveTable = {}

    # Getters and setters

    def setStatus(self, status):
        self.__status = status

    def getStatus(self):
        return self.__status

    def setTotalUsed(self, total_used):
        self.__totalUsed = total_used

    def getTotalUsed(self):
        return self.__totalUsed if not str(self.__totalUsed).endswith("0") else int(self.__totalUsed)

    def setTotalLeft(self, total_left):
        self.__totalLeft = total_left

    def getTotalLeft(self):
        return self.__totalLeft if not str(self.__totalLeft).endswith("0") else int(self.__totalLeft)

    def setLeaveTable(self, leave_table):
        self.__leaveTable = leave_table

    def getLeaveTable(self):
        return self.__leaveTable
