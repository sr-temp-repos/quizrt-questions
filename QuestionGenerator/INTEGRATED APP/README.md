This Vagrant enables the Ubuntu 15.04 Vivid - 64-bit environment box and provisions Node 5.x and Mongodb 3.2 packages.

Further, it also provisions necessary Git and Build Essential tools.

Also provisioning to create a mongodb.service file to provision for running Mongodb as a background service using systemd. This does not get enabled by default installation steps.

Note: The StackRoute participants need to replace the contents of Vagrantfile with Stk_Vagrantfile.
