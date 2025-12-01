import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Trophy, LogOut, Plus, Trash2, Users, Calendar, Award, Crown, Star } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminDashboard = () => {
  const [user, setUser] = useState(null);
  const [colleges, setColleges] = useState([]);
  const [events, setEvents] = useState([]);
  const [users, setUsers] = useState([]);
  const [newCollege, setNewCollege] = useState({ name: "", code: "" });
  const [newEvent, setNewEvent] = useState({ title: "", code: "" });
  const [newUser, setNewUser] = useState({ username: "", email: "", password: "", role: "coordinator" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setUser(userData);
      fetchData();
    }
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  };

  const fetchData = async () => {
    try {
      const [collegesRes, eventsRes, usersRes] = await Promise.all([
        fetch(`${API}/colleges`, { headers: getAuthHeaders() }),
        fetch(`${API}/events`, { headers: getAuthHeaders() }),
        fetch(`${API}/admin/users`, { headers: getAuthHeaders() }),
      ]);

      const collegesData = await collegesRes.json();
      const eventsData = await eventsRes.json();
      const usersData = await usersRes.json();

      setColleges(collegesData);
      setEvents(eventsData);
      setUsers(usersData);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load data");
    }
  };

  const handleAddCollege = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(`${API}/colleges`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(newCollege),
      });

      if (response.ok) {
        toast.success("College added successfully");
        setNewCollege({ name: "", code: "" });
        fetchData();
      } else {
        toast.error("Failed to add college");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCollege = async (collegeId) => {
    try {
      const response = await fetch(`${API}/colleges/${collegeId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        toast.success("College deleted successfully");
        fetchData();
      } else {
        toast.error("Failed to delete college");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  const handleAddEvent = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(`${API}/events`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ ...newEvent, coordinator_ids: [] }),
      });

      if (response.ok) {
        toast.success("Event added successfully");
        setNewEvent({ title: "", code: "" });
        fetchData();
      } else {
        toast.error("Failed to add event");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    try {
      const response = await fetch(`${API}/events/${eventId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        toast.success("Event deleted successfully");
        fetchData();
      } else {
        toast.error("Failed to delete event");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(`${API}/auth/register`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ ...newUser, event_ids: [] }),
      });

      if (response.ok) {
        toast.success("User added successfully");
        setNewUser({ username: "", email: "", password: "", role: "coordinator" });
        fetchData();
      } else {
        const data = await response.json();
        toast.error(data.detail || "Failed to add user");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="min-h-screen py-8 px-4 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
              Admin Dashboard
            </h1>
            <div className="flex items-center gap-2 text-gray-400">
              <Crown className="w-4 h-4 text-yellow-400" />
              <span>Welcome, <span className="text-purple-400 font-semibold">{user?.username}</span></span>
            </div>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="border-white/10 text-gray-300 hover:bg-white/10 hover:text-white transition-all duration-300"
            data-testid="admin-logout-btn"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-black/40 backdrop-blur-xl border border-white/10">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6 text-white" />
              </div>
              <p className="text-3xl font-bold text-white">{colleges.length}</p>
              <p className="text-sm text-gray-400">Colleges</p>
            </CardContent>
          </Card>
          <Card className="bg-black/40 backdrop-blur-xl border border-white/10">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <p className="text-3xl font-bold text-white">{events.length}</p>
              <p className="text-sm text-gray-400">Events</p>
            </CardContent>
          </Card>
          <Card className="bg-black/40 backdrop-blur-xl border border-white/10">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Award className="w-6 h-6 text-white" />
              </div>
              <p className="text-3xl font-bold text-white">{users.filter(u => u.role === 'coordinator').length}</p>
              <p className="text-sm text-gray-400">Coordinators</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="colleges" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-black/40 backdrop-blur-xl border border-white/10 p-1 rounded-xl">
            <TabsTrigger
              value="colleges"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300 rounded-lg"
              data-testid="colleges-tab"
            >
              Colleges
            </TabsTrigger>
            <TabsTrigger
              value="events"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300 rounded-lg"
              data-testid="events-tab"
            >
              Events
            </TabsTrigger>
            <TabsTrigger
              value="users"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300 rounded-lg"
              data-testid="users-tab"
            >
              Users
            </TabsTrigger>
          </TabsList>

          {/* Colleges Tab */}
          <TabsContent value="colleges" className="mt-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg">
                      <Plus className="w-5 h-5 text-white" />
                    </div>
                    <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                      Add New College
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAddCollege} className="space-y-4">
                    <div className="space-y-3">
                      <Label className="text-gray-300 text-sm font-medium">College Name</Label>
                      <Input
                        value={newCollege.name}
                        onChange={(e) => setNewCollege({ ...newCollege, name: e.target.value })}
                        placeholder="e.g., GM Institute of Technology"
                        required
                        className="bg-black/30 border-white/10 text-white h-12"
                        data-testid="college-name-input"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-gray-300 text-sm font-medium">College Code</Label>
                      <Input
                        value={newCollege.code}
                        onChange={(e) => setNewCollege({ ...newCollege, code: e.target.value })}
                        placeholder="e.g., GMIT"
                        required
                        className="bg-black/30 border-white/10 text-white h-12"
                        data-testid="college-code-input"
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-3 transition-all duration-300 transform hover:scale-105"
                      data-testid="add-college-btn"
                    >
                      {loading ? (
                        <div className="flex items-center justify-center">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                          Adding...
                        </div>
                      ) : (
                        "Add College"
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card className="bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl">
                <CardHeader>
                  <CardTitle className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                    All Colleges ({colleges.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {colleges.map((college) => (
                      <div
                        key={college.id}
                        className="flex items-center justify-between p-4 bg-black/30 border border-white/10 rounded-xl backdrop-blur-sm transition-all duration-300 hover:bg-white/5"
                        data-testid={`college-item-${college.id}`}
                      >
                        <div>
                          <p className="font-semibold text-white">{college.name}</p>
                          <div className="flex items-center gap-4 mt-1">
                            <span className="text-sm text-gray-400">{college.code}</span>
                            <span className="text-sm text-green-400 font-semibold">
                              {college.total_points} points
                            </span>
                          </div>
                        </div>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-300"
                              data-testid={`delete-college-${college.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-gray-900 border-white/10 backdrop-blur-xl">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-white">Delete College?</AlertDialogTitle>
                              <AlertDialogDescription className="text-gray-400">
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10">
                                Cancel
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteCollege(college.id)}
                                className="bg-red-600 hover:bg-red-700 text-white transition-all duration-300"
                                data-testid={`confirm-delete-college-${college.id}`}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events" className="mt-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg">
                      <Plus className="w-5 h-5 text-white" />
                    </div>
                    <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                      Add New Event
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAddEvent} className="space-y-4">
                    <div className="space-y-3">
                      <Label className="text-gray-300 text-sm font-medium">Event Title</Label>
                      <Input
                        value={newEvent.title}
                        onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                        placeholder="e.g., Coding Battle"
                        required
                        className="bg-black/30 border-white/10 text-white h-12"
                        data-testid="event-title-input"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-gray-300 text-sm font-medium">Event Code</Label>
                      <Input
                        value={newEvent.code}
                        onChange={(e) => setNewEvent({ ...newEvent, code: e.target.value })}
                        placeholder="e.g., EVT01"
                        required
                        className="bg-black/30 border-white/10 text-white h-12"
                        data-testid="event-code-input"
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white py-3 transition-all duration-300 transform hover:scale-105"
                      data-testid="add-event-btn"
                    >
                      {loading ? (
                        <div className="flex items-center justify-center">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                          Adding...
                        </div>
                      ) : (
                        "Add Event"
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card className="bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl">
                <CardHeader>
                  <CardTitle className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                    All Events ({events.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {events.map((event) => (
                      <div
                        key={event.id}
                        className="flex items-center justify-between p-4 bg-black/30 border border-white/10 rounded-xl backdrop-blur-sm transition-all duration-300 hover:bg-white/5"
                        data-testid={`event-item-${event.id}`}
                      >
                        <div>
                          <p className="font-semibold text-white">{event.title}</p>
                          <p className="text-sm text-gray-400">{event.code}</p>
                        </div>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-300"
                              data-testid={`delete-event-${event.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-gray-900 border-white/10 backdrop-blur-xl">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-white">Delete Event?</AlertDialogTitle>
                              <AlertDialogDescription className="text-gray-400">
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10">
                                Cancel
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteEvent(event.id)}
                                className="bg-red-600 hover:bg-red-700 text-white transition-all duration-300"
                                data-testid={`confirm-delete-event-${event.id}`}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="mt-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                      <Plus className="w-5 h-5 text-white" />
                    </div>
                    <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                      Add New User
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAddUser} className="space-y-4">
                    <div className="space-y-3">
                      <Label className="text-gray-300 text-sm font-medium">Username</Label>
                      <Input
                        value={newUser.username}
                        onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                        placeholder="John Doe"
                        required
                        className="bg-black/30 border-white/10 text-white h-12"
                        data-testid="user-username-input"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-gray-300 text-sm font-medium">Email</Label>
                      <Input
                        type="email"
                        value={newUser.email}
                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                        placeholder="user@example.com"
                        required
                        className="bg-black/30 border-white/10 text-white h-12"
                        data-testid="user-email-input"
                      />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-gray-300 text-sm font-medium">Password</Label>
                      <Input
                        type="password"
                        value={newUser.password}
                        onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                        placeholder="••••••••"
                        required
                        className="bg-black/30 border-white/10 text-white h-12"
                        data-testid="user-password-input"
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-3 transition-all duration-300 transform hover:scale-105"
                      data-testid="add-user-btn"
                    >
                      {loading ? (
                        <div className="flex items-center justify-center">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                          Adding...
                        </div>
                      ) : (
                        "Add User"
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card className="bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl">
                <CardHeader>
                  <CardTitle className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    All Users ({users.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {users.map((usr) => (
                      <div
                        key={usr.id}
                        className="p-4 bg-black/30 border border-white/10 rounded-xl backdrop-blur-sm transition-all duration-300 hover:bg-white/5"
                        data-testid={`user-item-${usr.id}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-semibold text-white">{usr.username}</p>
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                            usr.role === 'admin' 
                              ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white'
                              : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                          }`}>
                            {usr.role.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-400">{usr.email}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* View Leaderboard */}
        <div className="mt-8 text-center">
          <Button
            onClick={() => navigate("/")}
            variant="outline"
            className="border-white/10 text-purple-400 hover:bg-purple-500/10 hover:text-purple-300 px-8 py-6 text-lg transition-all duration-300"
            data-testid="admin-view-leaderboard-btn"
          >
            <Trophy className="w-5 h-5 mr-2" />
            View Live Leaderboard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;