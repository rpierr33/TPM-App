import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface EscalationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  programId?: string;
}

export function EscalationModal({ open, onOpenChange, programId }: EscalationModalProps) {
  const [formData, setFormData] = useState({
    summary: "",
    description: "",
    urgency: "medium",
    ownerId: "",
    impact: "",
    sendToSlack: true,
    sendToTeams: false,
    sendToEmail: false,
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createEscalationMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/escalations", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Escalation created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/escalations"] });
      onOpenChange(false);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create escalation",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      summary: "",
      description: "",
      urgency: "medium",
      ownerId: "",
      impact: "",
      sendToSlack: true,
      sendToTeams: false,
      sendToEmail: false,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const escalationData = {
      ...formData,
      programId,
      reporterId: "current-user-id", // In real app, get from auth context
    };

    createEscalationMutation.mutate(escalationData);
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900">
            Create Escalation
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="summary" className="text-sm font-medium text-gray-700 mb-2">
              Escalation Summary
            </Label>
            <Input
              id="summary"
              value={formData.summary}
              onChange={(e) => handleInputChange("summary", e.target.value)}
              placeholder="Brief description of the issue"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="urgency" className="text-sm font-medium text-gray-700 mb-2">
                Urgency
              </Label>
              <Select value={formData.urgency} onValueChange={(value) => handleInputChange("urgency", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="owner" className="text-sm font-medium text-gray-700 mb-2">
                Owner
              </Label>
              <Select value={formData.ownerId} onValueChange={(value) => handleInputChange("ownerId", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select owner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sarah-chen">Sarah Chen</SelectItem>
                  <SelectItem value="alex-rivera">Alex Rivera</SelectItem>
                  <SelectItem value="maria-lopez">Maria Lopez</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="description" className="text-sm font-medium text-gray-700 mb-2">
              Description
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Detailed description of the escalation"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="impact" className="text-sm font-medium text-gray-700 mb-2">
              Impact Description
            </Label>
            <Textarea
              id="impact"
              value={formData.impact}
              onChange={(e) => handleInputChange("impact", e.target.value)}
              placeholder="Describe the impact and potential consequences"
              rows={3}
            />
          </div>

          <div>
            <Label className="text-sm font-medium text-gray-700 mb-2">Send To:</Label>
            <div className="flex flex-wrap gap-4 mt-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="slack"
                  checked={formData.sendToSlack}
                  onCheckedChange={(checked) => handleInputChange("sendToSlack", checked)}
                />
                <Label htmlFor="slack" className="text-sm">Slack #engineering</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="teams"
                  checked={formData.sendToTeams}
                  onCheckedChange={(checked) => handleInputChange("sendToTeams", checked)}
                />
                <Label htmlFor="teams" className="text-sm">Teams Leadership</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="email"
                  checked={formData.sendToEmail}
                  onCheckedChange={(checked) => handleInputChange("sendToEmail", checked)}
                />
                <Label htmlFor="email" className="text-sm">Email Stakeholders</Label>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-primary-500 text-white hover:bg-primary-600"
              disabled={createEscalationMutation.isPending}
            >
              {createEscalationMutation.isPending ? "Creating..." : "Create Escalation"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
