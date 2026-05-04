# Server Docs

## System Design

The design will be totally decentralized with 2 roles, master and slave

---

### Master

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

---

### Slave
Every slave will have 3 processes:
- Process A: This proces will have 3 threads:
    - Thread A:
        - This thread will listen for new tasks from a master and assign the task to one of its child processes. If all the child processes have hit the max container limit it will spawn a new Process C as its child process for the new task. If it has hit its max children limit, the slave will report to Thread B.
    - Thread B:
        - This thread will communicate with the `Master Type 1` which assigned the task to it and return the task and also report its capacity to the nearest `Master Type 2`.
    - Thread C:
        - This thread will listen for exit signals from the child processes. Exit signals indicate task completion and it is able to accept new tasks.
- Process B: This process will send a heartbeat signal to a `Master Type 2`.
- Process C: This process will create containers and new threads to manage those containers as per assignments and on completion the managing thread will directly send the outputs to the nearest `Master Type 0`. If the task and if finished and the master acknowledges the output, the managing thread sends a signal to the parent process and waits until a new task is assigned.

