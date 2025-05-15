import { Card, CardContent } from "@/components/ui/card";

export default function MediaGallery() {
  return (
    <Card className="mb-6">
      <CardContent className="p-5">
        <h3 className="font-semibold text-lg mb-4">Visual Perspectives</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* A peaceful meditation scene representing spiritual contemplation */}
          <div className="rounded-lg overflow-hidden h-48 bg-slate-100">
            <img 
              src="https://images.unsplash.com/photo-1506126613408-eca07ce68773?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=500&h=300" 
              alt="Person meditating in peaceful natural setting" 
              className="w-full h-full object-cover"
            />
          </div>
          
          {/* A collection of religious texts from different traditions */}
          <div className="rounded-lg overflow-hidden h-48 bg-slate-100">
            <img 
              src="https://images.unsplash.com/photo-1504052434569-70ad5836ab65?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=500&h=300" 
              alt="Collection of religious texts from various traditions" 
              className="w-full h-full object-cover"
            />
          </div>
          
          {/* A contemplative natural scene representing philosophical reflection */}
          <div className="rounded-lg overflow-hidden h-48 bg-slate-100">
            <img 
              src="https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=500&h=300" 
              alt="Contemplative natural scene at sunset" 
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
