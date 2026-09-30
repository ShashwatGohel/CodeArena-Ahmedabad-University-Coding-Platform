# Server Docs

## System Design

The design will be totally decentralized with 2 roles, master and slave

### Master
Each master sends a heartbeat message to its nearest `Master Type 2` which contains the current waiting queue as the additional information.

#### Type 0:
This master will take responses from slaves and send it out to the correct clients
Importance:
- This will help us keep the slaves abstract and the system will be flexible
- If a client knows about a slaves IP address they will be able to directly talk with it, but if the slave is no longer a part of the system then the response will be flawed.

#### Type 1:
This master will listen for new clients and will assign those clients to slaves

Importance:
- There will be a single common IP shared by all the machines who are `Master Type 1` and the network delivers to the nearest master using **AnyCast**.

#### Type 2:
This master will keep track of all the available slaves and masters in the networks by listening to their heartbeats and will also periodically broadcast the list of available nodes to all masters and a heartbeat signal to slaves. If the broadcast does not reach to any node, that node also becomes a `Master Type 2`.

#### Common Tasks of a Master:
- A master will always listen for messages from a `Master Type 2` and spawn a new child process in the same machine if not received.
- If a specific type of Master is unavailable, the current master will create a new child process with the required number of such masters.
- If the waiting queue of the master is about to be full, they will transfer some / new clients to a new master with less load after looking at the last message from `Master Type 2`.



### Slave
Every slave will have 3 processes:
- Process A: This proces will have 3 threads:
    - Thread A:
        - This thread will listen for new tasks from a master and assign the task to one of its child processes. If all the child processes have hit the max container limit it will spawn a new Process C as its child process for the new task. If it has hit its max children limit, the slave will report to Thread B.
    - Thread B:
        - This thread will communicate with the `Master Type 1` which assigned the task to it and return the task and also report its capacity to the nearest `Master Type 2`.
    - Thread C:
        - This thread will listen for exit signals from the child processes. Exit signals indicate task completion and it is able to accept new tasks.
- Process B: This process will send a heartbeat signal to a `Master Type 2`. This heartbeat conveys its current capacity as the addtional information.
- Process C: This process will create containers and new threads to manage those containers as per assignments and on completion the managing thread will directly send the outputs to the nearest `Master Type 0`. If the task and if finished and the master acknowledges the output, the managing thread sends a signal to the parent process and waits until a new task is assigned.



### Heartbeat:
The heartbeat will consist of the following items:
- IP of the sender
- Port of the sender
- Additional information about itself



## Failure Scenarios and their Solutions:

### Failure Scenarios:
1. Master partial failure:
    Some of the masters fail, but there are more than the minimum required number of masters.
2. Master total failure:
    The masters in the network are less than the minimum required (either failed or cannot be reached).
3. Slave partial failure:
    Some of the slaves fail, but there are more than the minimum required number of slaves.
4. Slave total failure:
    The slaves in the network are less than the minimum required (either failed or cannot be reached).
5. Resource limit:
    All the slaves are at full capacity and all the masters are heavily loaded.



### Solutions (Tentative):
1. Selection Algorithm:
    Every node sends a random number in the network and the node(s) with the highest number is / are selected for the new role. If a single node is required to be selected and there are multiple such selected candidates then multiple such rounds are performed until a single node is selected.
2. Master partial failure:
    The masters of `Master Type 2` which keep a track of load on the other masters and if load increases, it creates new masters in the same machine and conveys the same to the other masters.
3. Master total failure:
    The slaves select the minimum number of required masters using the `Selection Algorithm` and promote those slaves to masters. If the minimum number of required slaves is not met, then a master and slave co-exist in a single machine as different processes.
4. Slave partial failure:
    The masters re-assign the tasks of the failed slaves and assign the failed slaves new tasks when they come into the network again.
5. Slave total failure:
    The masters select the minimum number of required slaves using the `Selection Algorithm` and demote those masters into slaves. If the minimum number of required masters is not met, then a master and slave co-exist in a single machine as different processes.
6. Resource limit:
    The masters simply drop requests if the slaves are at full capacity and if their queues are completely full.



## Unsolved Questions:
