import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Trophy, LogOut, Calendar, Award, Trash2, Users, Plus, Star, Edit3, Target, Search, ChevronDown, X } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CoordinatorDashboard = () => {
  const [user, setUser] = useState(null);
  const [events, setEvents] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [results, setResults] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState("");
  const [selectedCollege, setSelectedCollege] = useState("");
  const [points, setPoints] = useState("");
  const [achievementStatement, setAchievementStatement] = useState("");
  const [loading, setLoading] = useState(false);
  const [collegeSearch, setCollegeSearch] = useState("");
  const [isCollegeDropdownOpen, setIsCollegeDropdownOpen] = useState(false);
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
      const [eventsRes, collegesRes, resultsRes] = await Promise.all([
        fetch(`${API}/events`, { headers: getAuthHeaders() }),
        fetch(`${API}/colleges`),
        fetch(`${API}/results`),
      ]);

      const eventsData = await eventsRes.json();
      const collegesData = await collegesRes.json();
      const resultsData = await resultsRes.json();

      setEvents(eventsData);
      setColleges(collegesData);
      setResults(resultsData);

      if (eventsData.length > 0 && !selectedEvent) {
        setSelectedEvent(eventsData[0].id);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load data");
    }
  };

  // Filter colleges based on search (case-insensitive)
  const filteredColleges = useMemo(() => {
    if (!collegeSearch.trim()) return colleges;
    
    const searchTerm = collegeSearch.toLowerCase();
    return colleges.filter(college => 
      college.name.toLowerCase().includes(searchTerm) ||
      college.code.toLowerCase().includes(searchTerm)
    );
  }, [colleges, collegeSearch]);

  const handleSubmitResult = async (e) => {
    e.preventDefault();
    if (!selectedEvent || !selectedCollege || !points || !achievementStatement) {
      toast.error("Please fill all fields");
      return;
    }

    const pointsValue = parseInt(points);
    if (isNaN(pointsValue) || pointsValue < 0) {
      toast.error("Please enter a valid positive number for points");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API}/results`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          event_id: selectedEvent,
          college_id: selectedCollege,
          points: pointsValue,
          achievement_statement: achievementStatement,
          position: 0,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(`Result added: ${pointsValue} points awarded`);
        setSelectedCollege("");
        setPoints("");
        setAchievementStatement("");
        setCollegeSearch("");
        fetchData();
      } else {
        toast.error(data.detail || "Failed to add result");
      }
    } catch (error) {
      toast.error("An error occurred");
      console.error("Submit error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteResult = async (resultId) => {
    try {
      const response = await fetch(`${API}/results/${resultId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        toast.success("Result deleted successfully");
        fetchData();
      } else {
        const data = await response.json();
        toast.error(data.detail || "Failed to delete result");
      }
    } catch (error) {
      toast.error("An error occurred");
      console.error("Delete error:", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const getEventResults = () => {
    if (!selectedEvent) return [];
    return results.filter((r) => r.event_id === selectedEvent);
  };

  const getCollegeName = (collegeId) => {
    const college = colleges.find((c) => c.id === collegeId);
    return college ? college.name : "Unknown";
  };

  const getEventName = (eventId) => {
    const event = events.find((e) => e.id === eventId);
    return event ? event.title : "Unknown";
  };

  const getSelectedCollegeName = () => {
    if (!selectedCollege) return "";
    const college = colleges.find((c) => c.id === selectedCollege);
    return college ? `${college.name} (${college.code})` : "";
  };

  const clearCollegeSearch = () => {
    setCollegeSearch("");
  };

  const handleCollegeSelect = (collegeId) => {
    setSelectedCollege(collegeId);
    setIsCollegeDropdownOpen(false);
    const college = colleges.find((c) => c.id === collegeId);
    if (college) {
      setCollegeSearch(`${college.name} (${college.code})`);
    }
  };

  // Quick points buttons for common values
  const quickPoints = [50, 100, 150, 200, 250, 300];

  return (
    <div className="min-h-screen py-8 px-4 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
              Coordinator Dashboard
            </h1>
            <div className="flex items-center gap-2 text-gray-400">
              <Star className="w-4 h-4 text-yellow-400" />
              <span>Welcome, <span className="text-purple-400 font-semibold">{user?.username}</span></span>
            </div>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="border-white/10 text-gray-300 hover:bg-white/10 hover:text-white transition-all duration-300"
            data-testid="logout-btn"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Submit Result Form */}
          <Card className="bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl">
                <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                  <Plus className="w-6 h-6 text-white" />
                </div>
                <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Add Result
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitResult} className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-gray-300 text-sm font-medium">Event</Label>
                  <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                    <SelectTrigger
                      className="bg-black/30 border-white/10 text-white h-12"
                      data-testid="select-event-trigger"
                    >
                      <SelectValue placeholder="Select event" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-white/10 backdrop-blur-xl max-h-60">
                      {events.map((event) => (
                        <SelectItem
                          key={event.id}
                          value={event.id}
                          className="text-white hover:bg-purple-500/20 focus:bg-purple-500/20"
                          data-testid={`event-option-${event.id}`}
                        >
                          {event.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label className="text-gray-300 text-sm font-medium">College</Label>
                  <div className="relative">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        type="text"
                        placeholder="Search college by name or code..."
                        value={collegeSearch}
                        onChange={(e) => {
                          setCollegeSearch(e.target.value);
                          if (!isCollegeDropdownOpen) setIsCollegeDropdownOpen(true);
                        }}
                        onClick={() => setIsCollegeDropdownOpen(true)}
                        className="bg-black/30 border-white/10 text-white pl-10 pr-10 h-12 w-full cursor-text"
                      />
                      {collegeSearch && (
                        <button
                          type="button"
                          onClick={clearCollegeSearch}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    
                    {/* Custom Dropdown */}
                    {isCollegeDropdownOpen && (
                      <>
                        <div 
                          className="fixed inset-0 z-10"
                          onClick={() => setIsCollegeDropdownOpen(false)}
                        />
                        <div className="absolute z-20 w-full mt-1 bg-gray-900 border border-white/10 rounded-lg shadow-2xl max-h-60 overflow-y-auto backdrop-blur-xl">
                          <div className="sticky top-0 bg-gray-900 p-2 border-b border-white/10">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-purple-300 font-medium">
                                {filteredColleges.length} colleges found
                              </span>
                              <button
                                onClick={() => setIsCollegeDropdownOpen(false)}
                                className="text-xs text-gray-400 hover:text-white"
                              >
                                Close
                              </button>
                            </div>
                            <div className="text-xs text-gray-500 px-2">
                              Type to search by college name or code
                            </div>
                          </div>
                          
                          {filteredColleges.length === 0 ? (
                            <div className="p-4 text-center text-gray-400">
                              <Search className="w-6 h-6 mx-auto mb-2 opacity-50" />
                              <p className="text-sm">No colleges found matching "{collegeSearch}"</p>
                            </div>
                          ) : (
                            <div className="py-1">
                              {filteredColleges.map((college) => (
                                <div
                                  key={college.id}
                                  className={`px-3 py-3 cursor-pointer transition-all duration-200 hover:bg-purple-500/20 ${
                                    selectedCollege === college.id ? 'bg-purple-500/30' : ''
                                  }`}
                                  onClick={() => handleCollegeSelect(college.id)}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex-1 min-w-0">
                                      <p className="text-white font-medium truncate">
                                        {college.name}
                                      </p>
                                      <p className="text-sm text-gray-400 truncate">
                                        Code: {college.code}
                                      </p>
                                    </div>
                                    {selectedCollege === college.id && (
                                      <div className="ml-2">
                                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </>
                    )}
                    
                    {/* Selected College Preview */}
                    {selectedCollege && (
                      <div className="mt-2 p-3 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-400/30 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-white">Selected College:</p>
                            <p className="text-purple-300 text-sm">{getSelectedCollegeName()}</p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedCollege("");
                              setCollegeSearch("");
                            }}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 px-2"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-gray-300 text-sm font-medium">Points</Label>
                  <div className="space-y-3">
                    <Input
                      type="number"
                      placeholder="Enter points (any positive number)"
                      value={points}
                      onChange={(e) => setPoints(e.target.value)}
                      className="bg-black/30 border-white/10 text-white h-12"
                      min="0"
                      data-testid="points-input"
                    />
                    {/* Quick Points Buttons */}
                    <div className="flex flex-wrap gap-2">
                      <span className="text-xs text-gray-400 font-medium flex items-center">
                        <Target className="w-3 h-3 mr-1" />
                        Quick Points:
                      </span>
                      {quickPoints.map((pointValue) => (
                        <Button
                          key={pointValue}
                          type="button"
                          variant="outline"
                          size="sm"
                          className={`text-xs border-purple-500/30 hover:bg-purple-500/20 transition-all duration-200 ${
                            points === pointValue.toString() 
                              ? 'bg-purple-500/30 text-purple-100 border-purple-400' 
                              : 'text-purple-300 hover:text-purple-100'
                          }`}
                          onClick={() => setPoints(pointValue.toString())}
                        >
                          {pointValue}
                        </Button>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-xs border-yellow-500/30 text-yellow-300 hover:bg-yellow-500/20 hover:text-yellow-100 transition-all duration-200"
                        onClick={() => setPoints("")}
                      >
                        Clear
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-gray-300 text-sm font-medium">Achievement Statement</Label>
                  <Textarea
                    placeholder="Describe the achievement (e.g., 'Won 1st place in Coding Competition', 'Special recognition for innovation', etc.)"
                    value={achievementStatement}
                    onChange={(e) => setAchievementStatement(e.target.value)}
                    className="bg-black/30 border-white/10 text-white min-h-[100px] resize-vertical"
                    data-testid="achievement-statement-input"
                  />
                  <p className="text-xs text-gray-500">
                    This will be displayed on the leaderboard to show why points were awarded
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={loading || !selectedEvent || !selectedCollege || !points || !achievementStatement}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-3 font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-purple-500/25 h-12"
                  data-testid="submit-result-btn"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                      Submitting...
                    </div>
                  ) : (
                    <>
                      <Target className="w-4 h-4 mr-2" />
                      Award Points
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Event Results */}
          <Card className="bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  Event Results
                </span>
              </CardTitle>
              <p className="text-sm text-gray-400 mt-2">
                {selectedEvent ? getEventName(selectedEvent) : "Select an event"}
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {getEventResults().length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>No results yet for this event</p>
                  </div>
                ) : (
                  getEventResults().map((result) => (
                    <div
                      key={result.id}
                      className="p-4 bg-black/30 border border-white/10 rounded-xl backdrop-blur-sm transition-all duration-300 hover:bg-white/5"
                      data-testid={`result-entry-${result.id}`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <p className="font-semibold text-white text-lg">{getCollegeName(result.college_id)}</p>
                          <div className="flex items-center gap-4 mt-1">
                            <span className="text-sm text-gray-400">
                              Points: <span className="text-green-400 font-semibold text-lg">{result.points}</span>
                            </span>
                          </div>
                        </div>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-300 shrink-0"
                              data-testid={`delete-result-${result.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-gray-900 border-white/10 backdrop-blur-xl">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-white">Delete Result?</AlertDialogTitle>
                              <AlertDialogDescription className="text-gray-400">
                                This will remove the result and deduct points from the college. This action cannot be
                                undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10">
                                Cancel
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteResult(result.id)}
                                className="bg-red-600 hover:bg-red-700 text-white transition-all duration-300"
                                data-testid={`confirm-delete-${result.id}`}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                      
                      {/* Achievement Statement */}
                      <div className="bg-purple-500/10 border border-purple-400/20 rounded-lg p-3 mt-2">
                        <div className="flex items-start gap-2">
                          <Edit3 className="w-4 h-4 text-purple-400 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-sm text-purple-300 font-medium mb-1">Achievement:</p>
                            <p className="text-white text-sm leading-relaxed">
                              {result.achievement_statement || "No description provided"}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-xs text-gray-500 mt-3 text-right">
                        {new Date(result.timestamp).toLocaleString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6 mt-8">
          <Card className="bg-black/40 backdrop-blur-xl border border-white/10">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <p className="text-3xl font-bold text-white">{events.length}</p>
              <p className="text-sm text-gray-400">Your Events</p>
            </CardContent>
          </Card>
          <Card className="bg-black/40 backdrop-blur-xl border border-white/10">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6 text-white" />
              </div>
              <p className="text-3xl font-bold text-white">{colleges.length}</p>
              <p className="text-sm text-gray-400">Total Colleges</p>
            </CardContent>
          </Card>
          <Card className="bg-black/40 backdrop-blur-xl border border-white/10">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <p className="text-3xl font-bold text-white">{results.length}</p>
              <p className="text-sm text-gray-400">Total Results</p>
            </CardContent>
          </Card>
          <Card className="bg-black/40 backdrop-blur-xl border border-white/10">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Award className="w-6 h-6 text-white" />
              </div>
              <p className="text-3xl font-bold text-white">
                {results.reduce((total, result) => total + (result.points || 0), 0)}
              </p>
              <p className="text-sm text-gray-400">Total Points Awarded</p>
            </CardContent>
          </Card>
        </div>

        {/* View Leaderboard */}
        <div className="mt-8 text-center">
          <Button
            onClick={() => navigate("/")}
            variant="outline"
            className="border-white/10 text-purple-400 hover:bg-purple-500/10 hover:text-purple-300 px-8 py-6 text-lg transition-all duration-300"
            data-testid="view-leaderboard-btn"
          >
            <Trophy className="w-5 h-5 mr-2" />
            View Live Leaderboard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CoordinatorDashboard;