from Models.Department import *


# Leave Model
class Leave(db.Model):
    tablename__ = 'leave'
    id = db.Column(db.Integer, primary_key=True)
    start_day = db.Column(db.String(100))
    end_day = db.Column(db.String(100))
    total_days = db.Column(db.Double)
    owner = db.Column(db.Integer, db.ForeignKey('personnel.id'))
    __status = None

    # Getters and setters

    def setStatus(self,status):
        self.__status = status

    def getStatus(self):
        return self.__status


