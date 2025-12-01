import { useState, useEffect } from "react";
import { Trophy, Users, TrendingUp, Crown, Star, Medal, Award, Zap, Sparkles, Target, Flame, Gem, BarChart3, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
const WS_URL = BACKEND_URL.replace("https://", "wss://").replace("http://", "ws://");

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [top10, setTop10] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchLeaderboard();
    connectWebSocket();
  }, []);

  useEffect(() => {
    // Always take top 10 for display
    const sorted = [...leaderboard].sort((a, b) => a.rank - b.rank);
    setTop10(sorted.slice(0, 10));
  }, [leaderboard]);

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch(`${API}/leaderboard`);
      const data = await response.json();
      setLeaderboard(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      setLoading(false);
    }
  };

  const connectWebSocket = () => {
    try {
      const ws = new WebSocket(`${WS_URL}/ws/leaderboard`);

      ws.onopen = () => {
        console.log("WebSocket connected");
      };

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (message.type === "leaderboard_update") {
          setLeaderboard(message.data);
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
      };

      ws.onclose = () => {
        console.log("WebSocket disconnected, reconnecting...");
        setTimeout(connectWebSocket, 3000);
      };

      return () => ws.close();
    } catch (error) {
      console.error("WebSocket connection error:", error);
    }
  };

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1:
        return <Crown className="w-5 h-5 text-yellow-300" />;
      case 2:
        return <Medal className="w-4 h-4 text-blue-300" />;
      case 3:
        return <Award className="w-4 h-4 text-amber-300" />;
      default:
        return <Target className="w-4 h-4 text-purple-300" />;
    }
  };

  const getRankColor = (rank) => {
    switch (rank) {
      case 1:
        return "from-yellow-400 to-yellow-600 shadow-lg shadow-yellow-500/30";
      case 2:
        return "from-blue-400 to-blue-600 shadow-lg shadow-blue-500/30";
      case 3:
        return "from-amber-400 to-amber-600 shadow-lg shadow-amber-500/30";
      case 4:
      case 5:
      case 6:
        return "from-purple-400 to-purple-600 shadow-lg shadow-purple-500/30";
      default:
        return "from-slate-500 to-slate-700 shadow shadow-slate-500/20";
    }
  };

  const getTopThreeData = () => {
    return leaderboard.slice(0, 3);
  };

  const getDisplayData = () => {
    return showAll ? leaderboard : top10;
  };

  const getMaxPoints = () => {
    if (leaderboard.length === 0) return 100;
    return Math.max(...leaderboard.map(item => item.total_points)) * 1.1;
  };

  const getRankBadgeStyle = (rank) => {
    if (rank <= 3) {
      return {
        1: "bg-gradient-to-br from-yellow-500/20 to-yellow-600/30 border-yellow-400/50",
        2: "bg-gradient-to-br from-blue-500/20 to-blue-600/30 border-blue-400/50",
        3: "bg-gradient-to-br from-amber-500/20 to-amber-600/30 border-amber-400/50",
      }[rank];
    } else if (rank <= 6) {
      return "bg-gradient-to-br from-purple-500/20 to-purple-600/30 border-purple-400/50";
    } else {
      return "bg-gradient-to-br from-slate-500/20 to-slate-600/30 border-slate-400/30";
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-spin"></div>
            <div className="absolute inset-2 bg-slate-900 rounded-full flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-purple-400 animate-pulse" />
            </div>
          </div>
          <p className="text-lg font-semibold text-purple-200">Loading Championship...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-purple-600/10 to-pink-600/10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-gradient-to-tr from-blue-600/10 to-cyan-600/10 rounded-full blur-2xl"></div>
      </div>

      <div className="h-full flex flex-col p-4 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl shadow-lg">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black bg-gradient-to-r from-purple-200 to-pink-200 bg-clip-text text-transparent">
                IGNITRON 2K25 General Championship
              </h1>
              <p className="text-sm text-purple-300">Leaderboard</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/30 px-3 py-1 rounded-lg">
              <Flame className="w-4 h-4 text-orange-400" />
              <span className="text-sm text-purple-200 font-medium">{top10.length} Top Colleges</span>
            </div>
            <Button
              onClick={() => navigate("/login")}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Coordinator Portal
            </Button>
          </div>
        </div>

        {/* Main Content - Split Screen */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left Side - Champion Bar Chart */}
          <Card className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 border border-purple-400/30 rounded-2xl backdrop-blur-xl shadow-2xl">
            <CardContent className="p-4 h-full flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-purple-300" />
                  <h2 className="text-lg font-bold text-purple-200">Champion Performance</h2>
                </div>
                <div className="text-xs text-purple-400 font-medium">
                  Top {top10.length} Displayed
                </div>
              </div>
              
              {/* Vertical Bar Chart Container */}
              <div className="flex-1 flex items-end justify-center gap-6 pb-4">
                {getTopThreeData().map((college, index) => {
                  const percentage = (college.total_points / getMaxPoints()) * 80;
                  const barHeight = `${Math.max(25, percentage)}%`;
                  
                  return (
                    <div key={college.rank} className="flex flex-col items-center gap-3 h-full">
                      {/* College Info */}
                      <div className="text-center min-h-[3rem] flex items-center">
                        <div>
                          <h3 className="text-sm font-semibold text-white line-clamp-1">
                            {college.college_name}
                          </h3>
                          <div className="flex items-center justify-center gap-1 mt-1">
                            <span className={`text-xs font-bold ${
                              college.rank === 1 ? 'text-yellow-400' :
                              college.rank === 2 ? 'text-blue-400' : 'text-amber-400'
                            }`}>
                              #{college.rank}
                            </span>
                            <span className="text-xs text-purple-400">•</span>
                            <span className="text-xs text-purple-400">{college.college_code}</span>
                          </div>
                        </div>
                      </div>

                      {/* Vertical Bar */}
                      <div className="flex flex-col items-center justify-end h-full w-20">
                        <div
                          className={`w-16 bg-gradient-to-t ${getRankColor(college.rank)} rounded-t-2xl relative transition-all duration-1000 ease-out shadow-2xl`}
                          style={{ height: barHeight }}
                        >
                          {/* Rank Badge on Bar */}
                          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-slate-800 border-2 border-purple-400 rounded-full flex items-center justify-center shadow-lg">
                            {getRankIcon(college.rank)}
                          </div>
                          
                          {/* Points inside Bar */}
                          <div className="absolute inset-0 flex items-end justify-center p-1">
                            <div className="text-center rotate-90 origin-bottom transform-gpu">
                              <div className="text-[9px] font-black text-white">
                                {college.total_points.toLocaleString()}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Points Label */}
                      <div className="text-center">
                        <div className="text-sm font-black text-transparent bg-gradient-to-r from-purple-200 to-pink-200 bg-clip-text">
                          {college.total_points.toLocaleString()}
                        </div>
                        <div className="text-xs text-purple-400 font-medium">points</div>
                      </div>
                    </div>
                  );
                })}
                
                {getTopThreeData().length === 0 && (
                  <div className="text-center py-8 flex-1 flex items-center justify-center">
                    <div>
                      <Trophy className="w-12 h-12 text-purple-400/30 mx-auto mb-3" />
                      <p className="text-purple-300/70">No rankings yet</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Championship Stats */}
              <div className="grid grid-cols-3 gap-3 pt-4 border-t border-purple-400/20">
                <div className="text-center p-2 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg border border-purple-400/20 hover:border-purple-400/40 transition-colors">
                  <div className="text-lg font-black text-transparent bg-gradient-to-r from-purple-200 to-pink-200 bg-clip-text">
                    {leaderboard.length}
                  </div>
                  <div className="text-xs text-purple-400">Total Colleges</div>
                </div>
                <div className="text-center p-2 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-lg border border-blue-400/20 hover:border-blue-400/40 transition-colors">
                  <div className="text-lg font-black text-transparent bg-gradient-to-r from-blue-200 to-cyan-200 bg-clip-text">
                    23
                  </div>
                  <div className="text-xs text-blue-400">Active Events</div>
                </div>
                <div className="text-center p-2 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg border border-green-400/20 hover:border-green-400/40 transition-colors">
                  <div className="text-lg font-black text-transparent bg-gradient-to-r from-green-200 to-emerald-200 bg-clip-text">
                    {top10.length}
                  </div>
                  <div className="text-xs text-green-400">Top Colleges</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Right Side - Top 10 Leaderboard */}
          <Card className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 border border-purple-400/30 rounded-2xl backdrop-blur-xl overflow-hidden shadow-2xl">
            <div className="flex flex-col h-full">
              {/* Table Header */}
              <div className="px-6 py-4 bg-gradient-to-r from-purple-600/40 to-pink-600/40 border-b border-purple-400/40">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-purple-200">Top 10 Championship Standings</h2>
                    <p className="text-xs text-purple-300">Real-time rankings of competing colleges</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 px-2 py-1 bg-purple-500/20 rounded-lg border border-purple-400/30">
                      <Zap className="w-3 h-3 text-green-400" />
                      <span className="text-xs text-purple-300 font-medium">Live</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Table Body - Scrollable */}
              <div className="flex-1 overflow-y-auto max-h-[calc(100vh-300px)]">
                <div className="divide-y divide-purple-400/10">
                  {getDisplayData().map((entry, idx) => {
                    const isTop3 = entry.rank <= 3;
                    const isTop10 = entry.rank <= 10;
                    
                    return (
                      <div
                        key={entry.rank}
                        className={`grid grid-cols-12 gap-3 px-6 py-4 transition-all duration-200 group ${
                          isTop3 
                            ? "bg-gradient-to-r from-purple-500/10 to-pink-500/10" 
                            : isTop10
                            ? "bg-gradient-to-r from-slate-800/50 to-slate-900/50 hover:bg-purple-500/5"
                            : "bg-slate-800/30 hover:bg-slate-800/50"
                        } ${isTop3 ? "border-l-4" : ""} ${
                          entry.rank === 1 ? "border-l-yellow-500" :
                          entry.rank === 2 ? "border-l-blue-500" :
                          entry.rank === 3 ? "border-l-amber-500" : "border-l-purple-500/30"
                        }`}
                      >
                        <div className="col-span-1 flex items-center">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${getRankBadgeStyle(entry.rank)}`}>
                            <span className={`text-sm font-black ${
                              isTop3 ? "text-white" : "text-purple-300"
                            }`}>
                              #{entry.rank}
                            </span>
                          </div>
                        </div>
                        
                        <div className="col-span-6 flex items-center">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              isTop3 
                                ? "bg-gradient-to-br from-purple-500/30 to-pink-500/30" 
                                : "bg-slate-700/50"
                            }`}>
                              {getRankIcon(entry.rank)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className={`text-sm font-semibold truncate ${
                                isTop3 ? "text-white" : "text-purple-100"
                              }`}>
                                {entry.college_name}
                              </h3>
                              <p className="text-xs text-purple-400 truncate">
                                {entry.college_code}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="col-span-3 flex items-center justify-center">
                          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                            isTop3 
                              ? "bg-purple-500/20 text-purple-200 border border-purple-400/30" 
                              : "text-purple-400"
                          }`}>
                            Rank #{entry.rank}
                          </div>
                        </div>
                        
                        <div className="col-span-2 flex items-center justify-end">
                          <div className="text-right">
                            <span className={`font-bold text-lg ${
                              isTop3 
                                ? "text-transparent bg-gradient-to-r from-purple-200 to-pink-200 bg-clip-text" 
                                : "text-purple-300"
                            }`}>
                              {entry.total_points.toLocaleString()}
                            </span>
                            <div className="text-xs text-purple-500 font-medium">points</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {leaderboard.length === 0 && (
                    <div className="text-center py-12">
                      <Trophy className="w-12 h-12 text-purple-400/30 mx-auto mb-3" />
                      <p className="text-purple-300/70 text-sm">No colleges ranked yet</p>
                      <p className="text-purple-500/50 text-xs mt-1">The championship will begin soon</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer with Toggle */}
              <div className="px-6 py-3 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-t border-purple-400/20">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-purple-400">
                    Showing {showAll ? "all" : "top"} {getDisplayData().length} of {leaderboard.length} colleges
                  </div>
                  {leaderboard.length > 10 && (
                    <Button
                      onClick={() => setShowAll(!showAll)}
                      variant="ghost"
                      size="sm"
                      className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 text-xs h-8"
                    >
                      {showAll ? (
                        <>
                          Show Top 10 Only
                          <ChevronUp className="w-3 h-3 ml-1" />
                        </>
                      ) : (
                        <>
                          Show All Colleges ({leaderboard.length})
                          <ChevronDown className="w-3 h-3 ml-1" />
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Bottom Status Bar */}
        <div className="mt-4 flex items-center justify-between text-xs">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-purple-400">
              <Users className="w-4 h-4" />
              <span>{leaderboard.length} Total Colleges</span>
            </div>
            <div className="flex items-center gap-2 text-blue-400">
              <TrendingUp className="w-4 h-4" />
              <span>{top10.length} Top Ranked</span>
            </div>
            <div className="flex items-center gap-2 text-green-400">
              <Flame className="w-4 h-4" />
              <span>WebSocket Connected</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-purple-400">Real-time Updates Active</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;