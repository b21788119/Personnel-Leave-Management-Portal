from flask_sqlalchemy import SQLAlchemy
from DB.DBObject import *


# Department Model
class Department(db.Model):
    tablename__ = 'department'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100))
    personnel = db.relationship('Personnel', back_populates="department")
