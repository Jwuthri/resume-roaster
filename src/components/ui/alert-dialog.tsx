import * as React from "react"
import { AlertTriangle, CheckCircle, XCircle, Info } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./dialog"
import { Button } from "./button"
import { cn } from "@/lib/utils"

export interface AlertDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description: string
  type?: 'info' | 'success' | 'warning' | 'error'
  confirmText?: string
  cancelText?: string
  onConfirm?: () => void | Promise<void>
  onCancel?: () => void | Promise<void>
  showCancel?: boolean
}

const getAlertIcon = (type: AlertDialogProps['type']) => {
  switch (type) {
    case 'success':
      return <CheckCircle className="h-6 w-6 text-green-600" />
    case 'warning':
      return <AlertTriangle className="h-6 w-6 text-yellow-600" />
    case 'error':
      return <XCircle className="h-6 w-6 text-red-600" />
    default:
      return <Info className="h-6 w-6 text-blue-600" />
  }
}

const getAlertColors = (type: AlertDialogProps['type']) => {
  switch (type) {
    case 'success':
      return {
        bg: 'bg-gradient-to-br from-green-50 to-emerald-50',
        border: 'border-green-200',
        title: 'text-green-800',
        description: 'text-green-700'
      }
    case 'warning':
      return {
        bg: 'bg-gradient-to-br from-yellow-50 to-orange-50',
        border: 'border-yellow-200',
        title: 'text-yellow-800',
        description: 'text-yellow-700'
      }
    case 'error':
      return {
        bg: 'bg-gradient-to-br from-red-50 to-pink-50',
        border: 'border-red-200',
        title: 'text-red-800',
        description: 'text-red-700'
      }
    default:
      return {
        bg: 'bg-gradient-to-br from-blue-50 to-indigo-50',
        border: 'border-blue-200',
        title: 'text-blue-800',
        description: 'text-blue-700'
      }
  }
}

export function AlertDialog({
  open,
  onOpenChange,
  title,
  description,
  type = 'info',
  confirmText = 'OK',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  showCancel = false
}: AlertDialogProps) {
  const [isConfirmLoading, setIsConfirmLoading] = React.useState(false)
  const [isCancelLoading, setIsCancelLoading] = React.useState(false)
  const colors = getAlertColors(type)
  const icon = getAlertIcon(type)

  const handleConfirm = async () => {
    if (isConfirmLoading || isCancelLoading) return
    
    setIsConfirmLoading(true)
    try {
      await onConfirm?.()
      onOpenChange(false)
    } catch (error) {
      console.error('Error in confirm callback:', error)
      // Don't close the dialog if there's an error
    } finally {
      setIsConfirmLoading(false)
    }
  }

  const handleCancel = async () => {
    if (isConfirmLoading || isCancelLoading) return
    
    setIsCancelLoading(true)
    try {
      await onCancel?.()
      onOpenChange(false)
    } catch (error) {
      console.error('Error in cancel callback:', error)
      // Don't close the dialog if there's an error
    } finally {
      setIsCancelLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("sm:max-w-md", colors.bg, colors.border)}>
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/80 shadow-sm">
            {icon}
          </div>
          {title && (
            <DialogTitle className={cn("text-xl font-semibold", colors.title)}>
              {title}
            </DialogTitle>
          )}
          <DialogDescription className={cn("text-base leading-relaxed", colors.description)}>
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          {showCancel && (
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isConfirmLoading || isCancelLoading}
              className="w-full sm:w-auto"
            >
              {isCancelLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                  Processing...
                </>
              ) : (
                cancelText
              )}
            </Button>
          )}
          <Button
            onClick={handleConfirm}
            disabled={isConfirmLoading || isCancelLoading}
            className="w-full sm:w-auto"
            variant={type === 'error' ? 'destructive' : 'default'}
          >
            {isConfirmLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                Processing...
              </>
            ) : (
              confirmText
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Hook for easier usage
export function useAlertDialog() {
  const [alertState, setAlertState] = React.useState<{
    open: boolean
    props: Omit<AlertDialogProps, 'open' | 'onOpenChange'>
  }>({
    open: false,
    props: { description: '' }
  })

  const showAlert = React.useCallback((props: Omit<AlertDialogProps, 'open' | 'onOpenChange'>) => {
    setAlertState({ open: true, props })
  }, [])

  const hideAlert = React.useCallback(() => {
    setAlertState(prev => ({ ...prev, open: false }))
  }, [])

  const AlertDialogComponent = React.useMemo(() => (
    <AlertDialog
      {...alertState.props}
      open={alertState.open}
      onOpenChange={hideAlert}
    />
  ), [alertState, hideAlert])

  return {
    showAlert,
    hideAlert,
    AlertDialog: AlertDialogComponent
  }
} 