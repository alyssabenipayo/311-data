import pysupercluster
import hashlib
import json
import cache
import pandas as pd
from os.path import join, dirname
from . import requests


CENTROIDS_FILE = join(dirname(__file__), '../../data/centroids.pkl')
CENTROIDS = pd.read_pickle(CENTROIDS_FILE)


def pins_key(filters):
    filters_json = json.dumps(str(filters), sort_keys=True).encode('utf-8')
    hashed_json = hashlib.md5(filters_json).hexdigest()
    return 'filters:{}:pins'.format(hashed_json)


def get_pins(filters):
    key = pins_key(filters)
    pins = cache.get(key)

    if pins is None:
        pins = requests.standard_query([
            'srnumber',
            'requesttype',
            'latitude',
            'longitude'
        ], filters, table='map')

        cache.set(key, pins)

    return pins


def get_clusters(pins, zoom, bounds, options):
    if len(pins) == 0:
        return []

    min_zoom = options.get('min_zoom', 0)
    max_zoom = options.get('max_zoom', 17)
    radius = options.get('radius', 200)
    extent = options.get('extent', 512)

    index = pysupercluster.SuperCluster(
        pins[['longitude', 'latitude']].to_numpy(),
        min_zoom=min_zoom,
        max_zoom=max_zoom,
        radius=radius,
        extent=extent)

    north = bounds.get('north', 90)
    south = bounds.get('south', -90)
    west = bounds.get('west', -180)
    east = bounds.get('east', 180)

    clusters = index.getClusters(
        top_left=(west, north),
        bottom_right=(east, south),
        zoom=zoom)

    for cluster in clusters:
        if cluster['count'] == 1:
            pin = pins.iloc[cluster['id']]
            cluster['srnumber'] = pin['srnumber']
            cluster['requesttype'] = pin['requesttype']
            del cluster['expansion_zoom']

    return clusters


async def clusters(startDate,
                   endDate,
                   requestTypes=[],
                   ncList=[],
                   zoom=0,
                   bounds={},
                   options={}):

    filters = {
        'startDate': startDate,
        'endDate': endDate,
        'requestTypes': requestTypes,
        'ncList': ncList}

    pins = get_pins(filters)
    return get_clusters(pins, zoom, bounds, options)


async def clusters2(startDate,
                   endDate,
                   requestTypes=[],
                   ncList=[],
                   zoom=0,
                   bounds={},
                   options={}):

    filters = {
        'startDate': startDate,
        'endDate': endDate,
        'requestTypes': requestTypes,
        'ncList': ncList}

    if zoom > -1:
        pins = get_pins(filters)
        pins['count'] = 1
        return pins.to_dict(orient='records')

    # TODO: add caching

    df = requests.standard_query(['nc'], filters, table='map')
    counts = df.groupby('nc').size()

    out = pd.DataFrame(counts) \
        .reset_index() \
        .rename(columns={0: 'count'})
    out['expansion_zoom'] = 14

    return out.merge(CENTROIDS, on='nc') \
        .rename(columns={'nc': 'id'}) \
        .to_dict(orient='records')


async def heatmap(startDate,
                  endDate,
                  requestTypes=[],
                  ncList=[]):

    filters = {
        'startDate': startDate,
        'endDate': endDate,
        'requestTypes': requestTypes,
        'ncList': ncList}

    key = pins_key(filters)
    pins = cache.get(key)

    fields = ['latitude', 'longitude']
    if pins is None:
        pins = requests.standard_query(fields, filters, table='map')
    else:
        pins = pins[fields]

    return pins.to_numpy()