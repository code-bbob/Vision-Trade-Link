import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { clearBranch } from '@/redux/accessSlice';
import { Button } from '@/components/ui/button';
import { Building, ChevronDown, RefreshCw } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const BranchSelector = () => {
  const dispatch = useDispatch();
  const { selectedBranch } = useSelector((state) => state.root);
  const [isChanging, setIsChanging] = useState(false);

  const handleChangeBranch = () => {
    setIsChanging(true);
    // Clear the selected branch to trigger branch selection
    dispatch(clearBranch());
    setIsChanging(false);
  };

  if (!selectedBranch) {
    return null;
  }

  return (
    <div className="flex items-center space-x-2 p-2 bg-slate-800 rounded-lg">
      <Building className="h-5 w-5 text-purple-400" />
      <div className="flex-1">
        <p className="text-sm font-medium text-white">
          {selectedBranch.name || `Branch ${selectedBranch.id}`}
        </p>
        <p className="text-xs text-slate-400">Current Branch</p>
      </div>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-white">
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={handleChangeBranch} disabled={isChanging}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isChanging ? 'animate-spin' : ''}`} />
            Change Branch
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default BranchSelector;
