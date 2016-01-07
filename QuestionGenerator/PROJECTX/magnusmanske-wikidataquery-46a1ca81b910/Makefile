CC=gcc
CXX=g++
CPPFLAGS=-g -pthread `mysql_config --libs` -l curl

SRCS_C=mongoose.c
SRCS_CXX_TOOL= myjson.cpp wd_inmem.cpp TItemQuery.cpp  wd_tool.cpp
SRCS_CXX_SERVER= myjson.cpp wd_inmem.cpp TItemQuery.cpp  wd_server.cpp
SRCS_CXX= $(SRCS_CXX_TOOL) $(SRCS_CXX_SERVER)
# wd_server.cpp 
# block_allocator.cpp json.cpp 

#EXE=wd_tool
#wd_inmem


OBJS_TOOL=$(subst .cpp,.o,$(SRCS_CXX_TOOL))
OBJS_SERVER=$(subst .c,.o,$(SRCS_C)) $(subst .cpp,.o,$(SRCS_CXX_SERVER))
OBJS=$(OBJS_TOOL) $(OBJS_SERVER)

all:
	make tool
	make server

tool: $(OBJS_TOOL)
	g++ $(OBJS_TOOL) -o wd_tool -O3 $(CPPFLAGS) -ldl

server: $(OBJS_SERVER)
	g++ $(OBJS_SERVER) -o wd_server -O3 $(CPPFLAGS) -ldl

clean:
	\rm -f $(OBJS) wd_tool wd_server

install:
	install -m 0555 wd_tool wd_server $(DESTDIR)/usr/bin

uninstall:
	\rm $(DESTDIR)/usr/bin/wd_tool
	\rm $(DESTDIR)/usr/bin/wd_server

%.o: %.cpp
	g++ $(CPPFLAGS) -c $<
