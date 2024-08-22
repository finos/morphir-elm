package mill.local

final case class CommandLine(command:String, args:Args, beforeArgs:BeforeArgs, afterArgs:AfterArgs) { self =>
    def toArgs:Seq[String] = Seq(command) ++ beforeArgs.toSeq ++ args.toSeq ++ afterArgs.toSeq
    def appendArgs(newArgs:Seq[String]) = copy(args = args ++ newArgs)
    def appendBeforeArgs(newArgs:Seq[String]) = copy(beforeArgs = beforeArgs ++ newArgs)
    def prependArgs(newArgs:Seq[String]) = copy(args = newArgs ++: args)    
    def prependBeforeArgs(newArgs:Seq[String]) = copy(beforeArgs = newArgs ++: beforeArgs)
    def appendAfterArgs(newArgs:Seq[String]) = copy(afterArgs = afterArgs ++ newArgs)
    def prependAfterArgs(newArgs:Seq[String]) = copy(afterArgs = newArgs ++: afterArgs)    
    override def toString():String = toArgs.mkString(" ")
}
