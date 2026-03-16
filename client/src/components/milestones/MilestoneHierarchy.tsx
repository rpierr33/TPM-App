import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  ChevronRight,
  ChevronDown,
  Calendar,
  ExternalLink,
  Plus,
  Flag,
  CheckCircle,
  Clock,
  AlertTriangle
} from "lucide-react";
import type {
  Milestone,
  JiraBepic,
  JiraEpic,
  JiraStory
} from "@shared/schema";

interface MilestoneHierarchyProps {
  milestone: Milestone;
  bepics: JiraBepic[];
  epics: JiraEpic[];
  stories: JiraStory[];
  onAddBepic: (milestoneId: string) => void;
  onAddEpic: (bepicId: string) => void;
  onAddStory: (epicId: string) => void;
}

export function MilestoneHierarchy({
  milestone,
  bepics,
  epics,
  stories,
  onAddBepic,
  onAddEpic,
  onAddStory,
}: MilestoneHierarchyProps) {
  const [expandedMilestone, setExpandedMilestone] = useState(false);
  const [expandedBepics, setExpandedBepics] = useState<Set<string>>(new Set());
  const [expandedEpics, setExpandedEpics] = useState<Set<string>>(new Set());

  const toggleBepic = (bepicId: string) => {
    const newExpanded = new Set(expandedBepics);
    if (newExpanded.has(bepicId)) {
      newExpanded.delete(bepicId);
    } else {
      newExpanded.add(bepicId);
    }
    setExpandedBepics(newExpanded);
  };

  const toggleEpic = (epicId: string) => {
    const newExpanded = new Set(expandedEpics);
    if (newExpanded.has(epicId)) {
      newExpanded.delete(epicId);
    } else {
      newExpanded.add(epicId);
    }
    setExpandedEpics(newExpanded);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": case "done": return "bg-green-100 text-green-800";
      case "in_progress": return "bg-blue-100 text-blue-800";
      case "blocked": return "bg-red-100 text-red-800";
      case "at_risk": return "bg-yellow-100 text-yellow-800";
      case "review": return "bg-purple-100 text-purple-800";
      case "testing": return "bg-orange-100 text-orange-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": case "done": return <CheckCircle size={14} className="text-green-600" />;
      case "in_progress": return <Clock size={14} className="text-blue-600" />;
      case "blocked": return <AlertTriangle size={14} className="text-red-600" />;
      default: return <Flag size={14} className="text-gray-600" />;
    }
  };

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 5: return "bg-red-100 text-red-800";
      case 4: return "bg-orange-100 text-orange-800";
      case 3: return "bg-yellow-100 text-yellow-800";
      case 2: return "bg-blue-100 text-blue-800";
      case 1: return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  // Business Epics directly under this Milestone
  const milestoneBepics = bepics.filter(bepic => bepic.milestoneId === milestone.id);

  return (
    <Card className="border border-gray-200">
      <Collapsible open={expandedMilestone} onOpenChange={setExpandedMilestone}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {expandedMilestone ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                <div className="flex items-center gap-2">
                  {getStatusIcon(milestone.status || "not_started")}
                  <span>{milestone.title}</span>
                </div>
                <Badge className={getStatusColor(milestone.status || "not_started")}>
                  {milestone.status?.replace("_", " ") || "Not Started"}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Calendar size={14} />
                  {milestone.dueDate ? new Date(milestone.dueDate).toLocaleDateString() : "No due date"}
                </div>
                <Badge variant="outline" className="text-xs">
                  {milestoneBepics.length} business epics
                </Badge>
              </div>
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="space-y-4">
              {milestone.description && (
                <p className="text-sm text-gray-600">{milestone.description}</p>
              )}

              {/* Add Business Epic Button */}
              <div className="flex justify-end">
                <Button
                  onClick={() => onAddBepic(milestone.id)}
                  size="sm"
                  variant="outline"
                  className="text-purple-600 border-purple-200 hover:bg-purple-50"
                >
                  <Plus size={14} className="mr-1" />
                  Add Business Epic
                </Button>
              </div>

              {/* Business Epics directly under Milestone */}
              <div className="space-y-3 ml-6">
                {milestoneBepics.map(bepic => {
                  const bepicEpics = epics.filter(epic => epic.bepicId === bepic.id);

                  return (
                    <div key={bepic.id} className="border-l-2 border-purple-200 pl-4">
                      <Collapsible open={expandedBepics.has(bepic.id)} onOpenChange={() => toggleBepic(bepic.id)}>
                        <CollapsibleTrigger asChild>
                          <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg cursor-pointer hover:bg-purple-100 transition-colors">
                            <div className="flex items-center gap-3">
                              {expandedBepics.has(bepic.id) ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                              <div className="flex items-center gap-2">
                                {getStatusIcon(bepic.status || "new")}
                                <span className="font-medium text-gray-900">{bepic.title}</span>
                              </div>
                              <Badge className={getStatusColor(bepic.status || "new")} variant="outline">
                                {bepic.status || "New"}
                              </Badge>
                              {bepic.jiraBepicKey && (
                                <Badge variant="outline" className="text-xs">
                                  {bepic.jiraBepicKey}
                                </Badge>
                              )}
                              {bepic.priority && (
                                <Badge variant="outline" className={getPriorityColor(bepic.priority)}>
                                  P{bepic.priority}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {bepicEpics.length} epics
                              </Badge>
                              {bepic.jiraUrl && (
                                <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                                  <ExternalLink size={12} />
                                </Button>
                              )}
                            </div>
                          </div>
                        </CollapsibleTrigger>

                        <CollapsibleContent>
                          <div className="mt-3 space-y-3">
                            {bepic.description && (
                              <p className="text-sm text-gray-600 ml-6">{bepic.description}</p>
                            )}

                            {/* Add Epic Button */}
                            <div className="flex justify-end ml-6">
                              <Button
                                onClick={() => onAddEpic(bepic.id)}
                                size="sm"
                                variant="outline"
                                className="text-green-600 border-green-200 hover:bg-green-50"
                              >
                                <Plus size={14} className="mr-1" />
                                Add Epic
                              </Button>
                            </div>

                            {/* Epics List */}
                            <div className="space-y-2 ml-6">
                              {bepicEpics.map(epic => {
                                const epicStories = stories.filter(story => story.epicId === epic.id);

                                return (
                                  <div key={epic.id} className="border-l-2 border-green-200 pl-3">
                                    <Collapsible open={expandedEpics.has(epic.id)} onOpenChange={() => toggleEpic(epic.id)}>
                                      <CollapsibleTrigger asChild>
                                        <div className="flex items-center justify-between p-2 bg-green-50 rounded cursor-pointer hover:bg-green-100 transition-colors">
                                          <div className="flex items-center gap-2">
                                            {expandedEpics.has(epic.id) ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                                            <div className="flex items-center gap-2">
                                              {getStatusIcon(epic.status || "new")}
                                              <span className="text-xs font-medium">{epic.title}</span>
                                            </div>
                                            <Badge className={getStatusColor(epic.status || "new")} variant="outline">
                                              {epic.status || "New"}
                                            </Badge>
                                            {epic.jiraEpicKey && (
                                              <Badge variant="outline" className="text-xs">
                                                {epic.jiraEpicKey}
                                              </Badge>
                                            )}
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="text-xs">
                                              {epicStories.length} stories
                                            </Badge>
                                            {epic.jiraUrl && (
                                              <Button size="sm" variant="ghost" className="h-5 w-5 p-0">
                                                <ExternalLink size={10} />
                                              </Button>
                                            )}
                                          </div>
                                        </div>
                                      </CollapsibleTrigger>

                                      <CollapsibleContent>
                                        <div className="mt-2 space-y-1">
                                          {/* Add Story Button */}
                                          <div className="flex justify-end ml-3">
                                            <Button
                                              onClick={() => onAddStory(epic.id)}
                                              size="sm"
                                              variant="outline"
                                              className="text-orange-600 border-orange-200 hover:bg-orange-50"
                                            >
                                              <Plus size={10} className="mr-1" />
                                              Add Story
                                            </Button>
                                          </div>

                                          {/* Stories List */}
                                          <div className="space-y-1 ml-3">
                                            {epicStories.map(story => (
                                              <div key={story.id} className="flex items-center justify-between p-1 bg-orange-50 rounded">
                                                <div className="flex items-center gap-2">
                                                  {getStatusIcon(story.status || "new")}
                                                  <span className="text-xs">{story.title}</span>
                                                  <Badge className={getStatusColor(story.status || "new")} variant="outline">
                                                    {story.status || "New"}
                                                  </Badge>
                                                  {story.jiraStoryKey && (
                                                    <Badge variant="outline" className="text-xs">
                                                      {story.jiraStoryKey}
                                                    </Badge>
                                                  )}
                                                  {story.storyPoints && (
                                                    <Badge variant="outline" className="text-xs">
                                                      {story.storyPoints} pts
                                                    </Badge>
                                                  )}
                                                </div>
                                                {story.jiraUrl && (
                                                  <Button size="sm" variant="ghost" className="h-4 w-4 p-0">
                                                    <ExternalLink size={8} />
                                                  </Button>
                                                )}
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      </CollapsibleContent>
                                    </Collapsible>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
