from flask_cors import CORS, cross_origin
from flask import request
from flask import Flask
import re
import base64
import numpy as np
import tensorflow as tf
from tensorflow import keras
import pandas as pd
import seaborn as sns
from pylab import rcParams
import matplotlib.pyplot as plt
from matplotlib import rc
from pandas.plotting import register_matplotlib_converters
from sklearn.model_selection import train_test_split
import urllib
import os
import csv
import cv2
import time
from PIL import Image
from keras_retinanet import models
from keras_retinanet.utils.image import read_image_bgr, preprocess_image, resize_image
from keras_retinanet.utils.visualization import draw_box, draw_caption
from keras_retinanet.utils.colors import label_color
from IPython.display import clear_output

print("Import Success.")

# %matplotlib inline
# %config InlineBackend.figure_format='retina'

register_matplotlib_converters()
sns.set(style='whitegrid', palette='muted', font_scale=1.5)

rcParams['figure.figsize'] = 22, 10

RANDOM_SEED = 42

np.random.seed(RANDOM_SEED)
tf.random.set_seed(RANDOM_SEED)


# os.makedirs("snapshots", exist_ok=True)
CLASSES_FILEnum = 'classesnum.csv'

model_path = "snapshots/resnet50_csv_15.h5"
modelnum = models.load_model(model_path, backbone_name='resnet50')
modelnum = models.convert_model(modelnum)

labels_to_namesnum = pd.read_csv(
    CLASSES_FILEnum, header=None).T.loc[0].to_dict()

print(labels_to_namesnum)


def sort_list(a, b, c, range):
    zipl = zip(b, a)
    zipy = zip(b, c)
    l = [x for _, x in sorted(zipl)]
    y = [x for _, x in sorted(zipy)]
    ziply = zip(l, y)
    l1 = []
    l2 = []
    for li, yi in ziply:
        if(yi <= range):
            l1.append(li)
        else:
            l2.append(li)
    l1 = l1+l2
    return l1


def predict(image):
    image = preprocess_image(image.copy())
    image, scale = resize_image(image)

    boxes, scores, labels = modelnum.predict_on_batch(
        np.expand_dims(image, axis=0)
    )
    boxes /= scale
    number = ''
    THRES_SCORE = 0.6
    numnum = []
    list2 = []
    ymin = []
    ymax = []
    y = []
    flag = 0
    for box, score, label in zip(boxes[0], scores[0], labels[0]):
        if score < THRES_SCORE:
            break
        flag = 1
        color = label_color(label)

        b = box.astype(int)
        # print(b)
        list2.append(b[0])
        ymin.append(b[1])
        ymax.append(b[3])
        draw_box(image, b, color=color)
        numnum.append(labels_to_namesnum[label])
    if(flag):
        zipymin = zip(ymin, ymax)
        yminmin, yminmax = min(zipymin)
        range = yminmin+(yminmax-yminmin)/2
        numnum = sort_list(numnum, list2, ymin, range)
        for x in numnum:
            number += x
        return number
    else:
        return ''


def decode_base64(data, altchars=b'+/'):
    """Decode base64, padding being optional.

    :param data: Base64 data as an ASCII byte string
    :returns: The decoded byte string.

    """
    data = re.sub(rb'[^a-zA-Z0-9%s]+' % altchars, b'', data)  # normalize
    missing_padding = len(data) % 4
    if missing_padding:
        data += b'=' * (4 - missing_padding)
    return base64.b64decode(data, altchars)


def data_uri_to_cv2_img(uri):
    encoded_data = uri.split(',')[1]
    decoded_data = decode_base64(encoded_data.encode())
    nparr = np.fromstring(decoded_data, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    return img


app = Flask(__name__)
cors = CORS(app)
app.config['CORS_HEADERS'] = 'Content-Type'


@app.route("/")
def home():
    return "<h1>Running Flask on Google Colab!</h1>"


@app.route("/api", methods=['POST'])
@cross_origin()
def api():
    json = request.get_json(force=True)
    dataURL = json["image"]
    cvimg = data_uri_to_cv2_img(dataURL)
    prediction = predict(cvimg)
    # cv2.imshow(cvimg)
    print(prediction)
    return prediction


app.run()