from sanic import Sanic
from sanic.config import LOGGING
import logging

LOGGING['loggers']={}
LOGGING['handlers']={}

logging_format = "[%(asctime)s] %(process)d-%(levelname)s "
logging_format += "%(module)s::%(funcName)s():l%(lineno)d: "
logging_format += "%(message)s"

logging.basicConfig(
    format=logging_format,
    level=logging.DEBUG
)

def log():
    return logging.getLogger()
