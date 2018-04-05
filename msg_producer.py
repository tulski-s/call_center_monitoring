# built-in
import datetime
import json
import random

# 3rd party
from pykafka import KafkaClient


def draw_intervals():
    no_incoming_per_min = random.normalvariate(random.choice(range(20,60)),
                                               random.choice(range(1,6)))
    incoming_perc = (no_incoming_per_min*50)/100
    no_resolved_per_min = incoming_perc
    no_lost_calls = incoming_perc/3
    return [60 / no_incoming_per_min, 
            60 / no_resolved_per_min, 
            60 / no_lost_calls]


msgs = {k[0]:[datetime.datetime.now(), k[1]] for k in zip(['incoming', 'resolved', 'lost'], draw_intervals())}
countries = ['United Kingdom', 'Poland', 'Germany', 'France', 'Spain', 'Portugal', 'Japan', 'China']
employees = ['Waylon Dalton', 'Thalia Cobb', 'Angela Walker', 'Mathias Little', 'Jonathon Sheppard',
             'Lee Ryan', 'Monica Dixon', 'Dakota Cooper', 'Noel Harrell', 'Tomas Santana', 'Izaiah Hart']
reasons = ['Change password', 'Where is my product?', 'Return claim', 'Cancel the order', 'Delay order', 'Change address']
incoming = 0
resolved = 0
lost = 0
client = KafkaClient(hosts="127.0.0.1:9092")
topic = client.topics['test'.encode()]
# using sync producer as it's toy example
producer = topic.get_sync_producer()

while True:
    for k in msgs.keys():
        if datetime.datetime.now() -  msgs[k][0] > datetime.timedelta(seconds=msgs[k][1]):
            new_intervals = draw_intervals()
            msgs[k][0] = datetime.datetime.now()
            msg = {'type': k}
            if k == 'incoming' and incoming < random.randint(10,20):
                msgs[k][1] = new_intervals[0]
                incoming += 1
                producer.produce(json.dumps(msg).encode())
            elif k == 'resolved' and incoming > 1:
                msg['employee'] = random.choice(employees)
                msg['reason'] = random.choice(reasons)
                msg['duration'] = abs(random.normalvariate(6, 7))
                waiting_time = abs(random.normalvariate(0, 10))
                msg['waitingTime'] = waiting_time
                if waiting_time > 6:
                    msg['qualityScore'] = random.randint(1,4)
                else:
                    msg['qualityScore'] = random.randint(4,10)
                msgs[k][1] = new_intervals[1]
                resolved += 1
                incoming -= 1
                producer.produce(json.dumps(msg).encode())
            elif k == 'lost' and incoming > 1:
                msgs[k][1] = new_intervals[2]
                msg['country'] = random.choice(countries)
                msg['waitingTime'] = abs(random.normalvariate(5, 13))
                lost += 1
                incoming -= 1
                producer.produce(json.dumps(msg).encode())
